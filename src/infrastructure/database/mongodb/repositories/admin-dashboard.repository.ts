import { injectable } from "inversify";
import { Types } from "mongoose";
import type { PaymentStatus } from "../../../../domain/entities/payment-transactions.entity";
import type {
	AdminDashboardChartQuery,
	AdminDashboardMetricSource,
	AdminDashboardRevenueAnalyticsSource,
	AdminDashboardRevenueBreakdownSource,
	AdminDashboardSessionOverviewSource,
	AdminDashboardSummarySource,
	AdminDashboardTopCategorySource,
	AdminDashboardTopMentorSource,
	AdminDashboardUserGrowthSource,
	IAdminDashboardRepository,
} from "../../../../domain/repositories/admin-dashboard.repository.interface";
import { getSystemHealthSnapshot } from "../../../../shared/utilities/health-check.util";
import { AdminDashboardRepositoryMapper } from "../mappers/admin-dashboard.mapper";
import { BookingModel } from "../models/booking.model";
import { InterestModel } from "../models/interests.model";
import { MentorModel } from "../models/mentor.model";
import { PaymentTransactionModel } from "../models/payment-transactions.model";
import { PlatformWalletModel } from "../models/platform-wallet.model";
import { UserModel } from "../models/user.model";
import {
	buildBuckets,
	type DateRange,
	getPreviousRange,
	getRangeFromQuery,
} from "../utils/admin-dashboard-date-range.util";
import {
	buildRefundAmountMap,
	getPlatformRevenueAmount,
	getRetainedRefundAmount,
	isCancelledBooking,
	isCompletedBooking,
	isMenteeCancelledBooking,
	isUpcomingBooking,
} from "../utils/admin-dashboard-revenue.util";
import {
	calculateEffectivePlatformRevenue,
	roundToTwo,
	sumUpcomingSessionLiability,
	toMonetaryBookingAmount,
} from "../utils/effective-platform-revenue.util";

type LeanBooking = {
	_id: string;
	mentorId: Types.ObjectId;
	startTime: Date;
	endTime: Date;
	updatedAt: Date;
	status: string;
	paymentStatus: string;
	paymentType: "STRIPE" | "COINS";
	totalAmount: number;
};

type LeanPayment = {
	amount: number;
	purpose: "coins" | "session";
	transactionOwner?: "platform" | "user" | "mentor";
	createdAt: Date;
	providerPaymentId: string;
};

const toMetricSource = (
	total: number,
	current: number,
	previous: number,
): AdminDashboardMetricSource =>
	AdminDashboardRepositoryMapper.toMetricSource({
		total,
		current,
		previous,
	});

@injectable()
export class MongoAdminDashboardRepository
	implements IAdminDashboardRepository
{
	async getSummary(): Promise<AdminDashboardSummarySource> {
		const now = new Date();
		const defaultQuery: AdminDashboardChartQuery = { period: "month" };
		const currentRange = getRangeFromQuery(defaultQuery, now);
		const previousRange = getPreviousRange(currentRange);
		const currentAndPreviousStart = previousRange.start;

		const [
			totalUsers,
			currentUsers,
			previousUsers,
			totalMentors,
			currentMentors,
			previousMentors,
			allBookings,
			rangeBookings,
			systemHealth,
			topMentors,
			topCategories,
		] = await Promise.all([
			UserModel.countDocuments({ role: "USER" }),
			UserModel.countDocuments({
				role: "USER",
				createdAt: { $gte: currentRange.start, $lte: currentRange.end },
			}),
			UserModel.countDocuments({
				role: "USER",
				createdAt: { $gte: previousRange.start, $lte: previousRange.end },
			}),
			MentorModel.countDocuments({ isApproved: true }),
			MentorModel.countDocuments({
				isApproved: true,
				createdAt: { $gte: currentRange.start, $lte: currentRange.end },
			}),
			MentorModel.countDocuments({
				isApproved: true,
				createdAt: { $gte: previousRange.start, $lte: previousRange.end },
			}),
			BookingModel.find(
				{
					status: { $ne: "SLOT_TAKEN_BY_ANOTHER_USER" },
					paymentStatus: { $ne: "FAILED" },
				},
				{
					_id: 1,
					startTime: 1,
					endTime: 1,
					updatedAt: 1,
					status: 1,
					paymentStatus: 1,
					paymentType: 1,
					totalAmount: 1,
				},
			).lean<LeanBooking[]>(),
			BookingModel.find(
				{
					status: { $ne: "SLOT_TAKEN_BY_ANOTHER_USER" },
					paymentStatus: { $ne: "FAILED" },
					startTime: { $gte: currentAndPreviousStart, $lte: currentRange.end },
				},
				{
					_id: 1,
					startTime: 1,
					endTime: 1,
					updatedAt: 1,
					status: 1,
					paymentStatus: 1,
					paymentType: 1,
					totalAmount: 1,
				},
			).lean<LeanBooking[]>(),
			getSystemHealthSnapshot(),
			this.getTopMentors(currentRange, previousRange),
			this.getTopCategories(currentRange),
		]);
		const refundAmountMap = buildRefundAmountMap(
			await this.getRevenuePayments(),
		);

		const totalSessions = allBookings.length;
		const currentSessions = rangeBookings.filter(
			(booking) =>
				booking.startTime.getTime() >= currentRange.start.getTime() &&
				booking.startTime.getTime() <= currentRange.end.getTime(),
		).length;
		const previousSessions = rangeBookings.filter(
			(booking) =>
				booking.startTime.getTime() >= previousRange.start.getTime() &&
				booking.startTime.getTime() <= previousRange.end.getTime(),
		).length;

		return AdminDashboardRepositoryMapper.toSummarySource({
			metrics: {
				totalUsers: toMetricSource(totalUsers, currentUsers, previousUsers),
				totalMentors: toMetricSource(
					totalMentors,
					currentMentors,
					previousMentors,
				),
				totalSessions: toMetricSource(
					totalSessions,
					currentSessions,
					previousSessions,
				),
				totalRevenue: toMetricSource(
					this.sumEffectivePlatformRevenue(allBookings, refundAmountMap),
					this.sumEffectivePlatformRevenue(
						allBookings,
						refundAmountMap,
						currentRange,
					),
					this.sumEffectivePlatformRevenue(
						allBookings,
						refundAmountMap,
						previousRange,
					),
				),
			},
			topMentors,
			topCategories,
			systemHealth,
		});
	}

	async getUserGrowth(
		query: AdminDashboardChartQuery,
	): Promise<AdminDashboardUserGrowthSource> {
		const range = getRangeFromQuery(query);
		const buckets = buildBuckets(query, range);

		const [usersBefore, mentorsBefore, usersInRange, mentorsInRange] =
			await Promise.all([
				UserModel.countDocuments({
					role: "USER",
					createdAt: { $lt: range.start },
				}),
				MentorModel.countDocuments({
					isApproved: true,
					createdAt: { $lt: range.start },
				}),
				UserModel.find(
					{
						role: "USER",
						createdAt: { $gte: range.start, $lte: range.end },
					},
					{ createdAt: 1 },
				).lean<{ createdAt: Date }[]>(),
				MentorModel.find(
					{
						isApproved: true,
						createdAt: { $gte: range.start, $lte: range.end },
					},
					{ createdAt: 1 },
				).lean<{ createdAt: Date }[]>(),
			]);

		let runningUsers = usersBefore;
		let runningMentors = mentorsBefore;

		const series = buckets.map((bucket) => {
			const usersAdded = usersInRange.filter(
				(item) =>
					item.createdAt.getTime() >= bucket.start.getTime() &&
					item.createdAt.getTime() <= bucket.end.getTime(),
			).length;
			const mentorsAdded = mentorsInRange.filter(
				(item) =>
					item.createdAt.getTime() >= bucket.start.getTime() &&
					item.createdAt.getTime() <= bucket.end.getTime(),
			).length;

			runningUsers += usersAdded;
			runningMentors += mentorsAdded;

			return AdminDashboardRepositoryMapper.toUserGrowthPointSource({
				label: bucket.label,
				users: runningUsers,
				mentors: runningMentors,
			});
		});

		return AdminDashboardRepositoryMapper.toUserGrowthSource({
			period: query.period,
			labels: buckets.map((bucket) => bucket.label),
			series,
		});
	}

	async getRevenueAnalytics(
		query: AdminDashboardChartQuery,
	): Promise<AdminDashboardRevenueAnalyticsSource> {
		const range = getRangeFromQuery(query);
		const buckets = buildBuckets(query, range);
		const [payments, bookings, effectiveRevenueBreakdown] = await Promise.all([
			this.getRevenuePayments(range),
			BookingModel.find(
				{
					status: {
						$in: ["COMPLETED", "CANCELLED_BY_MENTEE"],
					},
					paymentStatus: "COMPLETED",
					$or: [
						{ endTime: { $gte: range.start, $lte: range.end } },
						{ updatedAt: { $gte: range.start, $lte: range.end } },
					],
				},
				{
					_id: 1,
					endTime: 1,
					updatedAt: 1,
					status: 1,
					paymentStatus: 1,
					paymentType: 1,
					totalAmount: 1,
				},
			).lean<LeanBooking[]>(),
			this.getEffectiveRevenueBreakdown(),
		]);
		const refundAmountMap = buildRefundAmountMap(payments);
		const completedBookings = bookings.filter(isCompletedBooking);
		const cancelledBookings = bookings.filter(isMenteeCancelledBooking);

		const series = buckets.map((bucket) => {
			const bucketSessionCommissions = completedBookings.reduce(
				(sum, booking) => {
					if (
						booking.endTime.getTime() < bucket.start.getTime() ||
						booking.endTime.getTime() > bucket.end.getTime()
					) {
						return sum;
					}

					return sum + getPlatformRevenueAmount(booking);
				},
				0,
			);

			const bucketRetainedRefunds = cancelledBookings.reduce((sum, booking) => {
				if (
					booking.updatedAt.getTime() < bucket.start.getTime() ||
					booking.updatedAt.getTime() > bucket.end.getTime()
				) {
					return sum;
				}

				return sum + getRetainedRefundAmount(booking, refundAmountMap);
			}, 0);

			return AdminDashboardRepositoryMapper.toRevenuePointSource({
				label: bucket.label,
				value: roundToTwo(bucketSessionCommissions + bucketRetainedRefunds),
			});
		});

		return AdminDashboardRepositoryMapper.toRevenueAnalyticsSource({
			period: query.period,
			labels: series.map((point) => point.label),
			series,
			breakdown: AdminDashboardRepositoryMapper.toRevenueBreakdownSource(
				effectiveRevenueBreakdown,
			),
		});
	}

	async getSessionOverview(): Promise<AdminDashboardSessionOverviewSource> {
		const now = new Date();
		const bookings = await BookingModel.find(
			{
				status: { $ne: "SLOT_TAKEN_BY_ANOTHER_USER" },
				paymentStatus: { $ne: "FAILED" },
			},
			{
				status: 1,
				paymentStatus: 1,
				endTime: 1,
			},
		).lean<Array<Pick<LeanBooking, "status" | "paymentStatus" | "endTime">>>();

		return AdminDashboardRepositoryMapper.toSessionOverviewSource({
			totalSessions:
				bookings.filter(isCompletedBooking).length +
				bookings.filter((booking) => isUpcomingBooking(booking, now)).length +
				bookings.filter(isCancelledBooking).length,
			completed: bookings.filter(isCompletedBooking).length,
			upcoming: bookings.filter((booking) => isUpcomingBooking(booking, now))
				.length,
			cancelled: bookings.filter(isCancelledBooking).length,
		});
	}

	private async getRevenuePayments(range?: DateRange): Promise<LeanPayment[]> {
		const dateFilter = range
			? { createdAt: { $gte: range.start, $lte: range.end } }
			: {};

		return PaymentTransactionModel.find(
			{
				status: { $in: ["completed", "refunded"] as PaymentStatus[] },
				$or: [
					{ transactionOwner: "platform" },
					{ transactionOwner: "user", purpose: "coins" },
					{ transactionOwner: { $exists: false }, purpose: "coins" },
					{ transactionOwner: null, purpose: "coins" },
				],
				...dateFilter,
			},
			{
				amount: 1,
				purpose: 1,
				transactionOwner: 1,
				createdAt: 1,
				providerPaymentId: 1,
			},
		).lean<LeanPayment[]>();
	}

	private async getEffectiveRevenueBreakdown(): Promise<AdminDashboardRevenueBreakdownSource> {
		const now = new Date();
		const [wallet, upcomingBookings] = await Promise.all([
			PlatformWalletModel.findOne({ key: "platform" }, { balance: 1 }).lean<{
				balance: number;
			} | null>(),
			BookingModel.find(
				{
					status: { $in: ["PENDING", "CONFIRMED", "STARTED"] },
					paymentStatus: "COMPLETED",
					endTime: { $gt: now },
				},
				{
					status: 1,
					paymentStatus: 1,
					paymentType: 1,
					totalAmount: 1,
					endTime: 1,
				},
			).lean<
				Array<
					Pick<
						LeanBooking,
						| "status"
						| "paymentStatus"
						| "paymentType"
						| "totalAmount"
						| "endTime"
					>
				>
			>(),
		]);

		const platformWalletBalance = roundToTwo((wallet?.balance ?? 0) / 100);
		const upcomingSessionLiability = sumUpcomingSessionLiability(
			upcomingBookings,
			now,
		);

		return AdminDashboardRepositoryMapper.toRevenueBreakdownSource({
			effectiveRevenue: calculateEffectivePlatformRevenue(
				wallet?.balance ?? 0,
				upcomingBookings,
				now,
			),
			platformWalletBalance,
			upcomingSessionLiability,
		});
	}

	private sumEffectivePlatformRevenue(
		bookings: LeanBooking[],
		refundAmounts: Map<string, number>,
		range?: DateRange,
	): number {
		return roundToTwo(
			bookings.reduce((total, booking) => {
				if (isCompletedBooking(booking)) {
					if (
						range &&
						(booking.endTime.getTime() < range.start.getTime() ||
							booking.endTime.getTime() > range.end.getTime())
					) {
						return total;
					}

					return total + getPlatformRevenueAmount(booking);
				}

				if (isMenteeCancelledBooking(booking)) {
					if (
						range &&
						(booking.updatedAt.getTime() < range.start.getTime() ||
							booking.updatedAt.getTime() > range.end.getTime())
					) {
						return total;
					}

					return total + getRetainedRefundAmount(booking, refundAmounts);
				}

				return total;
			}, 0),
		);
	}

	private async getTopMentors(
		currentRange: DateRange,
		previousRange: DateRange,
	): Promise<AdminDashboardTopMentorSource[]> {
		const bookings = await BookingModel.find(
			{
				status: "COMPLETED",
				paymentStatus: "COMPLETED",
				endTime: { $gte: previousRange.start, $lte: currentRange.end },
			},
			{
				mentorId: 1,
				endTime: 1,
				paymentType: 1,
				totalAmount: 1,
			},
		).lean<
			Array<
				Pick<
					LeanBooking,
					"mentorId" | "endTime" | "paymentType" | "totalAmount"
				>
			>
		>();

		const mentorIds = [
			...new Set(bookings.map((booking) => booking.mentorId.toString())),
		];
		const mentors = await MentorModel.find(
			{ _id: { $in: mentorIds.map((id) => new Types.ObjectId(id)) } },
			{ userId: 1 },
		).lean<{ _id: Types.ObjectId; userId: Types.ObjectId }[]>();
		const users = await UserModel.find(
			{ _id: { $in: mentors.map((mentor) => mentor.userId) } },
			{ name: 1 },
		).lean<{ _id: Types.ObjectId; name: string }[]>();

		const mentorUserMap = new Map(
			mentors.map((mentor) => [
				mentor._id.toString(),
				mentor.userId.toString(),
			]),
		);
		const userNameMap = new Map(
			users.map((user) => [user._id.toString(), user.name]),
		);
		const totals = new Map<string, { current: number; previous: number }>();

		for (const booking of bookings) {
			const mentorId = booking.mentorId.toString();
			const existing = totals.get(mentorId) ?? { current: 0, previous: 0 };
			const amount = toMonetaryBookingAmount(booking);

			if (
				booking.endTime.getTime() >= currentRange.start.getTime() &&
				booking.endTime.getTime() <= currentRange.end.getTime()
			) {
				existing.current += amount;
			} else {
				existing.previous += amount;
			}

			totals.set(mentorId, existing);
		}

		return [...totals.entries()]
			.map(([mentorId, value]) => {
				const userId = mentorUserMap.get(mentorId) ?? "";
				return AdminDashboardRepositoryMapper.toTopMentorSource({
					mentorId,
					name: userNameMap.get(userId) ?? "Unknown Mentor",
					currentRevenue: roundToTwo(value.current),
					previousRevenue: roundToTwo(value.previous),
				});
			})
			.filter((item) => item.currentRevenue > 0)
			.sort((a, b) => b.currentRevenue - a.currentRevenue)
			.slice(0, 5);
	}

	private async getTopCategories(
		range: DateRange,
	): Promise<AdminDashboardTopCategorySource[]> {
		const bookings = await BookingModel.find(
			{
				status: { $ne: "SLOT_TAKEN_BY_ANOTHER_USER" },
				paymentStatus: { $ne: "FAILED" },
				startTime: { $gte: range.start, $lte: range.end },
			},
			{ mentorId: 1 },
		).lean<Array<{ mentorId: Types.ObjectId }>>();

		if (bookings.length === 0) {
			return [];
		}

		const mentorIds = [
			...new Set(bookings.map((booking) => booking.mentorId.toString())),
		];
		const mentors = await MentorModel.find(
			{ _id: { $in: mentorIds.map((id) => new Types.ObjectId(id)) } },
			{ areasOfExpertise: 1 },
		).lean<{ _id: Types.ObjectId; areasOfExpertise: Types.ObjectId[] }[]>();

		const interestIds = [
			...new Set(
				mentors.flatMap((mentor) =>
					mentor.areasOfExpertise.map((interestId) => interestId.toString()),
				),
			),
		];
		const interests = await InterestModel.find(
			{ _id: { $in: interestIds.map((id) => new Types.ObjectId(id)) } },
			{ name: 1 },
		).lean<{ _id: Types.ObjectId; name: string }[]>();

		const mentorInterestsMap = new Map(
			mentors.map((mentor) => [
				mentor._id.toString(),
				mentor.areasOfExpertise.map((interestId) => interestId.toString()),
			]),
		);
		const interestNameMap = new Map(
			interests.map((interest) => [interest._id.toString(), interest.name]),
		);
		const counts = new Map<string, number>();

		for (const booking of bookings) {
			for (const interestId of mentorInterestsMap.get(
				booking.mentorId.toString(),
			) ?? []) {
				counts.set(interestId, (counts.get(interestId) ?? 0) + 1);
			}
		}

		const total = [...counts.values()].reduce((sum, count) => sum + count, 0);

		return [...counts.entries()]
			.map(([categoryId, sessions]) =>
				AdminDashboardRepositoryMapper.toTopCategorySource({
					categoryId,
					name: interestNameMap.get(categoryId) ?? "Unknown Category",
					sessions,
					sharePercent: total > 0 ? roundToTwo((sessions / total) * 100) : 0,
				}),
			)
			.sort((a, b) => b.sessions - a.sessions)
			.slice(0, 5);
	}
}
