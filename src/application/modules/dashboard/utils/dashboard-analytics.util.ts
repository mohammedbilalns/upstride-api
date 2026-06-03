import type {
	BookingStatus,
	PaymentStatus,
	PaymentType,
} from "../../../../domain/entities/booking.entity";
import {
	COIN_VALUE,
	IST_OFFSET_MINUTES,
	PLATFOM_COMMISSION,
} from "../../../../shared/constants/app.constants";
import { getUtcRangeForIstDate } from "../../../../shared/utilities/time.util";
import type {
	DashboardActivityItemDto,
	DashboardActivityOverviewDto,
	DashboardArticleDto,
	DashboardGrowthMetric,
	DashboardPeriod,
	DashboardRole,
	DashboardTopCategoryDto,
	DashboardUpcomingSessionDto,
} from "../dtos/dashboard.dto";

const IST_TIME_ZONE = "Asia/Kolkata";
const DAY_MS = 24 * 60 * 60 * 1000;

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: IST_TIME_ZONE,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

const monthKeyFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: IST_TIME_ZONE,
	year: "numeric",
	month: "2-digit",
});

const dayLabelFormatter = new Intl.DateTimeFormat("en-IN", {
	timeZone: IST_TIME_ZONE,
	day: "numeric",
	month: "short",
});

const monthLabelFormatter = new Intl.DateTimeFormat("en-IN", {
	timeZone: IST_TIME_ZONE,
	month: "short",
});

type IdLike = { toString?: () => string } | string | null | undefined;

export type DashboardBookingRecord = {
	_id: string;
	mentorId:
		| string
		| {
				_id?: IdLike;
				userId?: { _id?: IdLike; name?: string; profilePictureId?: string };
				areasOfExpertise?: Array<{
					_id?: IdLike;
					id?: IdLike;
					name?: string;
				}>;
		  };
	menteeId: string | { _id?: IdLike; name?: string };
	startTime: Date;
	endTime: Date;
	status: BookingStatus;
	paymentType: PaymentType;
	paymentStatus: PaymentStatus;
	totalAmount: number;
	currency: string;
	createdAt: Date;
	updatedAt: Date;
};

export const DASHBOARD_EXCLUDED_BOOKING_STATUSES: BookingStatus[] = [
	"CANCELLED_BY_MENTEE",
	"CANCELLED_BY_MENTOR",
	"SLOT_TAKEN_BY_ANOTHER_USER",
];

const getMentorCommissionPercentage = (): number =>
	Math.max(0, 100 - PLATFOM_COMMISSION.SESSION_PERCENTAGE);

export const getBookingGrossCoins = (
	booking: DashboardBookingRecord,
): number =>
	booking.paymentType === "COINS"
		? booking.totalAmount
		: booking.totalAmount * COIN_VALUE;

export const getBookingMentorNetCoins = (
	booking: DashboardBookingRecord,
): number =>
	Math.round(
		(getBookingGrossCoins(booking) * getMentorCommissionPercentage()) / 100,
	);

export const getBookingPlatformFeeCoins = (
	booking: DashboardBookingRecord,
): number => getBookingGrossCoins(booking) - getBookingMentorNetCoins(booking);

export type DashboardSavedMentorRecord = {
	_id: string;
	mentorId:
		| string
		| {
				_id?: IdLike;
				userId?: { _id?: IdLike; name?: string; profilePictureId?: string };
		  };
	listId:
		| string
		| {
				_id?: IdLike;
				name?: string;
		  };
	createdAt: Date;
};

export type DashboardSessionRecord = {
	createdAt?: Date;
	lastUsedAt?: Date;
};

export type DashboardArticleRecord = {
	_id: string;
	slug: string;
	title: string;
	description: string;
	featuredImageUrl: string;
	views: number;
	createdAt: Date;
	authorId: string;
};

export type DashboardArticleViewRecord = {
	articleId: string;
	userId: string;
};

export interface DashboardBucket {
	key: string;
	label: string;
	start: Date;
	end: Date;
}

const normalizeId = (value: IdLike): string => {
	if (!value) return "";
	if (typeof value === "string") return value;
	return value.toString?.() ?? "";
};

const getIstParts = (
	date: Date,
): {
	year: number;
	month: number;
	day: number;
} => {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: IST_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);

	const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
	const month = Number(
		parts.find((part) => part.type === "month")?.value ?? "0",
	);
	const day = Number(parts.find((part) => part.type === "day")?.value ?? "0");
	return { year, month, day };
};

const getIstDateKey = (date: Date): string => dateKeyFormatter.format(date);

const getIstMonthKey = (date: Date): string => monthKeyFormatter.format(date);

const getUtcRangeForIstMonth = (
	year: number,
	monthIndex: number,
): { start: Date; end: Date } => {
	const startMs =
		Date.UTC(year, monthIndex, 1, 0, 0, 0, 0) - IST_OFFSET_MINUTES * 60_000;
	const endMs =
		Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999) -
		IST_OFFSET_MINUTES * 60_000;
	return { start: new Date(startMs), end: new Date(endMs) };
};

const getUtcRangeForIstYear = (year: number): { start: Date; end: Date } => {
	const startMs =
		Date.UTC(year, 0, 1, 0, 0, 0, 0) - IST_OFFSET_MINUTES * 60_000;
	const endMs =
		Date.UTC(year + 1, 0, 0, 23, 59, 59, 999) - IST_OFFSET_MINUTES * 60_000;
	return { start: new Date(startMs), end: new Date(endMs) };
};

const getBucketLabel = (date: Date, period: DashboardPeriod): string => {
	if (period === "year") {
		return monthLabelFormatter.format(date);
	}
	return dayLabelFormatter.format(date);
};

export const buildBuckets = (
	period: DashboardPeriod,
	now: Date = new Date(),
): DashboardBucket[] => {
	const { year, month, day } = getIstParts(now);
	const buckets: DashboardBucket[] = [];

	if (period === "week") {
		const anchor = new Date(Date.UTC(year, month - 1, day));
		for (let offset = 6; offset >= 0; offset -= 1) {
			const current = new Date(anchor.getTime() - offset * DAY_MS);
			const { start, end } = getUtcRangeForIstDate(current);
			buckets.push({
				key: getIstDateKey(current),
				label: getBucketLabel(current, period),
				start,
				end,
			});
		}
		return buckets;
	}

	if (period === "month") {
		for (let currentDay = 1; currentDay <= day; currentDay += 1) {
			const current = new Date(Date.UTC(year, month - 1, currentDay));
			const { start, end } = getUtcRangeForIstDate(current);
			buckets.push({
				key: getIstDateKey(current),
				label: getBucketLabel(current, period),
				start,
				end,
			});
		}
		return buckets;
	}

	const currentYearRange = getUtcRangeForIstYear(year);
	const maxMonth = month;
	for (let monthIndex = 0; monthIndex < maxMonth; monthIndex += 1) {
		const current = new Date(Date.UTC(year, monthIndex, 1));
		const { start, end } = getUtcRangeForIstMonth(year, monthIndex);
		buckets.push({
			key: getIstMonthKey(current),
			label: getBucketLabel(current, period),
			start,
			end,
		});
	}

	if (buckets.length === 0) {
		buckets.push({
			key: getIstMonthKey(now),
			label: getBucketLabel(now, period),
			start: currentYearRange.start,
			end: currentYearRange.end,
		});
	}

	return buckets;
};

export const calculateGrowth = (
	current: number,
	previous: number,
): DashboardGrowthMetric => {
	if (previous === 0) {
		return {
			current,
			previous,
			changePercent: current > 0 ? 100 : 0,
		};
	}

	return {
		current,
		previous,
		changePercent: Number((((current - previous) / previous) * 100).toFixed(2)),
	};
};

export const sumBookingHours = (bookings: DashboardBookingRecord[]): number =>
	Number(
		bookings
			.filter(
				(booking) =>
					booking.status === "COMPLETED" &&
					booking.paymentStatus === "COMPLETED",
			)
			.reduce((total, booking) => {
				const start = new Date(booking.startTime).getTime();
				const end = new Date(booking.endTime).getTime();
				return total + Math.max(0, end - start) / 3_600_000;
			}, 0)
			.toFixed(2),
	);

export const countCompletedBookings = (
	bookings: DashboardBookingRecord[],
): number =>
	bookings.filter(
		(booking) =>
			booking.status === "COMPLETED" && booking.paymentStatus === "COMPLETED",
	).length;

export const countUpcomingBookings = (
	bookings: DashboardBookingRecord[],
	now: Date = new Date(),
): number =>
	bookings.filter((booking) => {
		const endTime = new Date(booking.endTime).getTime();
		return (
			endTime > now.getTime() &&
			booking.paymentStatus !== "FAILED" &&
			["PENDING", "CONFIRMED", "STARTED"].includes(booking.status)
		);
	}).length;

export const buildUpcomingSessions = (
	bookings: DashboardBookingRecord[],
	role: DashboardRole,
	now: Date = new Date(),
	limit = 2,
): DashboardUpcomingSessionDto[] =>
	bookings
		.filter((booking) => {
			const endTime = new Date(booking.endTime).getTime();
			return (
				endTime > now.getTime() &&
				booking.paymentStatus !== "FAILED" &&
				["PENDING", "CONFIRMED", "STARTED"].includes(booking.status)
			);
		})
		.sort(
			(a, b) =>
				new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
		)
		.slice(0, limit)
		.map((booking) => ({
			id: booking._id,
			startTime: new Date(booking.startTime).toISOString(),
			endTime: new Date(booking.endTime).toISOString(),
			status: booking.status,
			paymentStatus: booking.paymentStatus,
			mentorName: role === "USER" ? getMentorName(booking.mentorId) : null,
			menteeName: role === "MENTOR" ? getMenteeName(booking.menteeId) : null,
			totalAmount: booking.totalAmount,
			currency: booking.currency,
		}));

export const buildActivityOverview = (
	bookings: DashboardBookingRecord[],
	period: DashboardPeriod,
	role: DashboardRole,
	now: Date = new Date(),
): DashboardActivityOverviewDto => {
	const buckets = buildBuckets(period, now);
	const sessions = buckets.map(() => 0);
	const hoursLearned = buckets.map(() => 0);
	const earnings = role === "MENTOR" ? buckets.map(() => 0) : undefined;

	const bucketLookup = new Map(
		buckets.map((bucket, index) => [bucket.key, index] as const),
	);

	for (const booking of bookings) {
		if (
			booking.status !== "COMPLETED" ||
			booking.paymentStatus !== "COMPLETED"
		) {
			continue;
		}

		const bookingDate = new Date(booking.startTime);
		const key =
			period === "year"
				? getIstMonthKey(bookingDate)
				: getIstDateKey(bookingDate);
		const bucketIndex = bucketLookup.get(key);
		if (bucketIndex === undefined) {
			continue;
		}

		sessions[bucketIndex] += 1;
		hoursLearned[bucketIndex] += Number(
			(
				Math.max(
					0,
					new Date(booking.endTime).getTime() - bookingDate.getTime(),
				) / 3_600_000
			).toFixed(2),
		);

		if (earnings) {
			earnings[bucketIndex] += getBookingMentorNetCoins(booking);
		}
	}

	return {
		period,
		labels: buckets.map((bucket) => bucket.label),
		sessions,
		hoursLearned: hoursLearned.map((value) => Number(value.toFixed(2))),
		...(earnings && {
			earnings: earnings.map((value) => Number(value.toFixed(2))),
		}),
	};
};

export const calculateLoginStreak = (
	sessions: DashboardSessionRecord[],
	now: Date = new Date(),
): number => {
	const uniqueDays = Array.from(
		new Set(
			sessions.map((session) =>
				getIstDateKey(session.createdAt ?? session.lastUsedAt ?? now),
			),
		),
	).sort((a, b) => b.localeCompare(a));

	if (uniqueDays.length === 0) {
		return 0;
	}

	let streak = 1;
	let previousDate = new Date(`${uniqueDays[0]}T00:00:00.000Z`);

	for (let index = 1; index < uniqueDays.length; index += 1) {
		const currentDate = new Date(`${uniqueDays[index]}T00:00:00.000Z`);
		if (previousDate.getTime() - currentDate.getTime() !== DAY_MS) {
			break;
		}
		streak += 1;
		previousDate = currentDate;
	}

	return streak;
};

export const getBookingMentorId = (booking: DashboardBookingRecord): string => {
	const mentorId = booking.mentorId;
	if (typeof mentorId === "string") {
		return mentorId;
	}
	return normalizeId(mentorId._id);
};

export const getBookingMentorName = (
	booking: DashboardBookingRecord,
): string | null => getMentorName(booking.mentorId);

export const getBookingMenteeName = (
	booking: DashboardBookingRecord,
): string | null => getMenteeName(booking.menteeId);

export const getMentorName = (
	mentorId: DashboardBookingRecord["mentorId"],
): string | null => {
	if (typeof mentorId === "string") {
		return null;
	}
	return mentorId.userId?.name ?? null;
};

export const getMenteeName = (
	menteeId: DashboardBookingRecord["menteeId"],
): string | null => {
	if (typeof menteeId === "string") {
		return null;
	}
	return menteeId.name ?? null;
};

export const getMentorCategories = (
	booking: DashboardBookingRecord,
): Array<{ id: string; name: string }> => {
	if (typeof booking.mentorId === "string") {
		return [];
	}

	return (booking.mentorId.areasOfExpertise ?? [])
		.map((category) => ({
			id: normalizeId(category._id ?? category.id),
			name: category.name ?? "",
		}))
		.filter((category) => category.id && category.name);
};

export const buildTopCategory = (
	bookings: DashboardBookingRecord[],
): DashboardTopCategoryDto | null => {
	const counts = new Map<string, { id: string; name: string; count: number }>();
	const seenMentors = new Set<string>();

	for (const booking of bookings) {
		const mentorId = getBookingMentorId(booking);
		if (!mentorId || seenMentors.has(mentorId)) {
			continue;
		}
		seenMentors.add(mentorId);
		for (const category of getMentorCategories(booking)) {
			const current = counts.get(category.id);
			if (current) {
				current.count += 1;
				continue;
			}
			counts.set(category.id, { ...category, count: 1 });
		}
	}

	const topCategory = Array.from(counts.values()).sort((a, b) => {
		if (b.count !== a.count) return b.count - a.count;
		return a.name.localeCompare(b.name);
	})[0];

	return topCategory ?? null;
};

export const buildSessionGrowth = (
	bookings: DashboardBookingRecord[],
	periodStart: Date,
	periodEnd: Date,
	role: DashboardRole,
): {
	current: number;
	previous: number;
	changePercent: number;
} => {
	const currentBookings = bookings.filter((booking) => {
		const date = new Date(booking.startTime);
		return date >= periodStart && date <= periodEnd;
	});

	const completedCount = currentBookings.filter(
		(booking) =>
			booking.status === "COMPLETED" && booking.paymentStatus === "COMPLETED",
	).length;

	const previousStart = new Date(
		periodStart.getTime() -
			(periodEnd.getTime() - periodStart.getTime() + DAY_MS),
	);
	const previousEnd = new Date(periodStart.getTime() - DAY_MS);

	const previousBookings = bookings.filter((booking) => {
		const date = new Date(booking.startTime);
		return date >= previousStart && date <= previousEnd;
	});

	const previousCount = previousBookings.filter(
		(booking) =>
			booking.status === "COMPLETED" && booking.paymentStatus === "COMPLETED",
	).length;

	if (role === "MENTOR") {
		return calculateGrowth(completedCount, previousCount);
	}

	return calculateGrowth(completedCount, previousCount);
};

export const buildHoursGrowth = (
	bookings: DashboardBookingRecord[],
	periodStart: Date,
	periodEnd: Date,
): DashboardGrowthMetric => {
	const currentBookings = bookings.filter((booking) => {
		const date = new Date(booking.startTime);
		return date >= periodStart && date <= periodEnd;
	});

	const currentHours = sumBookingHours(currentBookings);

	const previousStart = new Date(
		periodStart.getTime() -
			(periodEnd.getTime() - periodStart.getTime() + DAY_MS),
	);
	const previousEnd = new Date(periodStart.getTime() - DAY_MS);
	const previousBookings = bookings.filter((booking) => {
		const date = new Date(booking.startTime);
		return date >= previousStart && date <= previousEnd;
	});

	const previousHours = sumBookingHours(previousBookings);

	return calculateGrowth(currentHours, previousHours);
};

export const mapRecommendedArticle = (article: {
	_id?: string;
	id?: string;
	slug: string;
	title: string;
	description: string;
	featuredImageUrl: string;
	views: number;
	createdAt: Date | string | null;
}): DashboardArticleDto => ({
	id: article._id ?? article.id ?? "",
	slug: article.slug,
	title: article.title,
	description: article.description,
	featuredImageUrl: article.featuredImageUrl,
	views: article.views,
	createdAt:
		article.createdAt instanceof Date
			? article.createdAt.toISOString()
			: new Date(article.createdAt ?? Date.now()).toISOString(),
});

export const mapRecentActivityBooking = (
	booking: DashboardBookingRecord,
	role: DashboardRole,
	type: "SESSION_BOOKED" | "SESSION_COMPLETED",
): DashboardActivityItemDto => {
	const mentorName = getMentorName(booking.mentorId) ?? "mentor";
	const menteeName = getMenteeName(booking.menteeId) ?? "user";
	const displayName = role === "MENTOR" ? menteeName : mentorName;
	const actionText =
		type === "SESSION_COMPLETED" ? "Session completed" : "Session booked";

	return {
		id: `${booking._id}:${type}`,
		type,
		title:
			role === "MENTOR" && type === "SESSION_BOOKED"
				? `New session booked by ${displayName}`
				: `${actionText} with ${displayName}`,
		description: `Booking status: ${booking.status}`,
		occurredAt:
			type === "SESSION_COMPLETED"
				? booking.updatedAt.toISOString()
				: booking.createdAt.toISOString(),
	};
};

export const mapRecentActivitySavedMentor = (
	record: DashboardSavedMentorRecord,
): DashboardActivityItemDto => {
	const mentorName =
		typeof record.mentorId === "string"
			? "mentor"
			: (record.mentorId.userId?.name ?? "mentor");
	const listName =
		typeof record.listId === "string"
			? "mentor list"
			: (record.listId.name ?? "mentor list");

	return {
		id: `${record._id}:SAVED_MENTOR`,
		type: "SAVED_MENTOR",
		title: `Saved ${mentorName} to ${listName}`,
		description: `Saved mentor activity`,
		occurredAt: record.createdAt.toISOString(),
	};
};

export const sortRecentActivity = (
	items: DashboardActivityItemDto[],
	limit = 3,
): DashboardActivityItemDto[] =>
	items
		.sort(
			(a, b) =>
				new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
		)
		.slice(0, limit);

export const getMonthRangeForNow = (
	now: Date = new Date(),
): { start: Date; end: Date } => {
	const { year, month } = getIstParts(now);
	return getUtcRangeForIstMonth(year, month - 1);
};

export const getPreviousMonthRangeForNow = (
	now: Date = new Date(),
): { start: Date; end: Date } => {
	const { year, month } = getIstParts(now);
	const previousMonth = month === 1 ? 12 : month - 1;
	const previousYear = month === 1 ? year - 1 : year;
	return getUtcRangeForIstMonth(previousYear, previousMonth - 1);
};
