import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	DashboardBookingRecord,
	DashboardSessionRecord,
} from "../../../../../src/application/modules/dashboard/utils/dashboard-analytics.util";
import {
	buildActivityOverview,
	buildHoursGrowth,
	buildSessionGrowth,
	buildTopCategory,
	calculateLoginStreak,
	countCompletedBookings,
	countUpcomingBookings,
	getBookingGrossCoins,
	getBookingMentorNetCoins,
	getBookingPlatformFeeCoins,
	getMenteeName,
	getMentorName,
	getMonthRangeForNow,
	mapRecentActivityBooking,
	sortRecentActivity,
	sumBookingHours,
} from "../../../../../src/application/modules/dashboard/utils/dashboard-analytics.util";
import {
	COIN_VALUE,
	PLATFOM_COMMISSION,
} from "../../../../../src/shared/constants/app.constants";

describe("dashboard-analytics.util", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-06-15T00:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("getBookingGrossCoins", () => {
		it("should return totalAmount when paymentType is COINS", () => {
			const booking: DashboardBookingRecord = {
				_id: "b1",
				mentorId: "m1",
				menteeId: "u1",
				startTime: new Date(),
				endTime: new Date(),
				status: "COMPLETED",
				paymentType: "COINS",
				paymentStatus: "COMPLETED",
				totalAmount: 1000,
				currency: "COINS",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = getBookingGrossCoins(booking);

			expect(result).toBe(1000);
		});

		it("should multiply totalAmount by COIN_VALUE when paymentType is STRIPE", () => {
			const booking: DashboardBookingRecord = {
				_id: "b1",
				mentorId: "m1",
				menteeId: "u1",
				startTime: new Date(),
				endTime: new Date(),
				status: "COMPLETED",
				paymentType: "STRIPE",
				paymentStatus: "COMPLETED",
				totalAmount: 500,
				currency: "INR",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = getBookingGrossCoins(booking);

			expect(result).toBe(500 * COIN_VALUE);
		});
	});

	describe("getBookingMentorNetCoins", () => {
		it("should calculate mentor commission correctly", () => {
			const booking: DashboardBookingRecord = {
				_id: "b1",
				mentorId: "m1",
				menteeId: "u1",
				startTime: new Date(),
				endTime: new Date(),
				status: "COMPLETED",
				paymentType: "COINS",
				paymentStatus: "COMPLETED",
				totalAmount: 1000,
				currency: "COINS",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = getBookingMentorNetCoins(booking);
			const expectedPercent = 100 - PLATFOM_COMMISSION.SESSION_PERCENTAGE;
			const expected = Math.round((1000 * expectedPercent) / 100);

			expect(result).toBe(expected);
		});
	});

	describe("getBookingPlatformFeeCoins", () => {
		it("should return the difference between gross and mentor net", () => {
			const booking: DashboardBookingRecord = {
				_id: "b1",
				mentorId: "m1",
				menteeId: "u1",
				startTime: new Date(),
				endTime: new Date(),
				status: "COMPLETED",
				paymentType: "COINS",
				paymentStatus: "COMPLETED",
				totalAmount: 1000,
				currency: "COINS",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = getBookingPlatformFeeCoins(booking);
			const gross = getBookingGrossCoins(booking);
			const mentorNet = getBookingMentorNetCoins(booking);

			expect(result).toBe(gross - mentorNet);
		});
	});

	describe("sumBookingHours", () => {
		it("should sum hours only for completed, paid bookings", () => {
			const bookings: DashboardBookingRecord[] = [
				{
					_id: "b1",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date("2025-06-01T10:00:00Z"),
					endTime: new Date("2025-06-01T11:00:00Z"),
					status: "COMPLETED",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					_id: "b2",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date("2025-06-02T10:00:00Z"),
					endTime: new Date("2025-06-02T11:30:00Z"),
					status: "COMPLETED",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1500,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					_id: "b3",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date("2025-06-03T10:00:00Z"),
					endTime: new Date("2025-06-03T11:00:00Z"),
					status: "CANCELLED_BY_MENTOR",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const result = sumBookingHours(bookings);

			// 1 hour + 1.5 hours = 2.5 hours (cancelled one is not counted)
			expect(result).toBe(2.5);
		});

		it("should return 0 for an empty array", () => {
			const result = sumBookingHours([]);

			expect(result).toBe(0);
		});

		it("should handle negative durations (shouldn't happen but safeguarded)", () => {
			const bookings: DashboardBookingRecord[] = [
				{
					_id: "b1",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date("2025-06-01T11:00:00Z"),
					endTime: new Date("2025-06-01T10:00:00Z"),
					status: "COMPLETED",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const result = sumBookingHours(bookings);

			expect(result).toBe(0);
		});
	});

	describe("countCompletedBookings", () => {
		it("should count only completed and paid bookings", () => {
			const bookings: DashboardBookingRecord[] = [
				{
					_id: "b1",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date(),
					endTime: new Date(),
					status: "COMPLETED",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					_id: "b2",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date(),
					endTime: new Date(),
					status: "PENDING",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					_id: "b3",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date(),
					endTime: new Date(),
					status: "COMPLETED",
					paymentStatus: "PENDING",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const result = countCompletedBookings(bookings);

			expect(result).toBe(1);
		});
	});

	describe("countUpcomingBookings", () => {
		it("should count pending, confirmed, and started bookings with future end times", () => {
			const now = new Date("2025-06-15T12:00:00.000Z");
			const bookings: DashboardBookingRecord[] = [
				{
					_id: "b1",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date("2025-06-15T13:00:00Z"),
					endTime: new Date("2025-06-15T14:00:00Z"),
					status: "PENDING",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					_id: "b2",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date("2025-06-15T13:00:00Z"),
					endTime: new Date("2025-06-15T14:00:00Z"),
					status: "CONFIRMED",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					_id: "b3",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date("2025-06-15T10:00:00Z"),
					endTime: new Date("2025-06-15T11:00:00Z"),
					status: "PENDING",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const result = countUpcomingBookings(bookings, now);

			// b1 and b2 are upcoming (end time is in the future)
			expect(result).toBe(2);
		});

		it("should exclude failed payments", () => {
			const now = new Date("2025-06-15T12:00:00.000Z");
			const bookings: DashboardBookingRecord[] = [
				{
					_id: "b1",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date("2025-06-15T13:00:00Z"),
					endTime: new Date("2025-06-15T14:00:00Z"),
					status: "PENDING",
					paymentStatus: "FAILED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const result = countUpcomingBookings(bookings, now);

			expect(result).toBe(0);
		});
	});

	describe("getMentorName", () => {
		it("should return mentor name when mentorId is an object with userId.name", () => {
			const mentorId = {
				userId: { name: "John Mentor", _id: "u1" },
				_id: "m1",
			};

			const result = getMentorName(mentorId);

			expect(result).toBe("John Mentor");
		});

		it("should return null when mentorId is a string", () => {
			const result = getMentorName("mentor-1");

			expect(result).toBeNull();
		});

		it("should return null when userId.name is undefined", () => {
			const mentorId = { userId: { _id: "u1" }, _id: "m1" };

			const result = getMentorName(mentorId);

			expect(result).toBeNull();
		});
	});

	describe("getMenteeName", () => {
		it("should return name when menteeId is an object with name", () => {
			const menteeId = { name: "Jane Mentee", _id: "u1" };

			const result = getMenteeName(menteeId);

			expect(result).toBe("Jane Mentee");
		});

		it("should return null when menteeId is a string", () => {
			const result = getMenteeName("mentee-1");

			expect(result).toBeNull();
		});

		it("should return null when name is undefined", () => {
			const menteeId = { _id: "u1" };

			const result = getMenteeName(menteeId);

			expect(result).toBeNull();
		});
	});

	describe("buildTopCategory", () => {
		it("should return the most common category across unique mentors", () => {
			const bookings: DashboardBookingRecord[] = [
				{
					_id: "b1",
					mentorId: {
						_id: "m1",
						areasOfExpertise: [
							{ _id: "cat1", name: "JavaScript" },
							{ _id: "cat2", name: "Python" },
						],
					},
					menteeId: "u1",
					startTime: new Date(),
					endTime: new Date(),
					status: "COMPLETED",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					_id: "b2",
					mentorId: {
						_id: "m2",
						areasOfExpertise: [{ _id: "cat2", name: "Python" }],
					},
					menteeId: "u2",
					startTime: new Date(),
					endTime: new Date(),
					status: "COMPLETED",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const result = buildTopCategory(bookings);

			expect(result?.name).toBe("Python");
			expect(result?.count).toBe(2);
		});

		it("should return null when there are no bookings", () => {
			const result = buildTopCategory([]);

			expect(result).toBeNull();
		});

		it("should count each mentor only once even if they have multiple bookings", () => {
			const bookings: DashboardBookingRecord[] = [
				{
					_id: "b1",
					mentorId: {
						_id: "m1",
						areasOfExpertise: [{ _id: "cat1", name: "JavaScript" }],
					},
					menteeId: "u1",
					startTime: new Date(),
					endTime: new Date(),
					status: "COMPLETED",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					_id: "b2",
					mentorId: {
						_id: "m1",
						areasOfExpertise: [{ _id: "cat1", name: "JavaScript" }],
					},
					menteeId: "u2",
					startTime: new Date(),
					endTime: new Date(),
					status: "COMPLETED",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const result = buildTopCategory(bookings);

			expect(result?.count).toBe(1);
		});
	});

	describe("calculateLoginStreak", () => {
		it("should return 1 for a single session", () => {
			const sessions: DashboardSessionRecord[] = [
				{ createdAt: new Date("2025-06-15T10:00:00Z") },
			];

			const result = calculateLoginStreak(sessions);

			expect(result).toBe(1);
		});

		it("should count consecutive days", () => {
			const sessions: DashboardSessionRecord[] = [
				{ createdAt: new Date("2025-06-15T10:00:00Z") },
				{ createdAt: new Date("2025-06-14T10:00:00Z") },
				{ createdAt: new Date("2025-06-13T10:00:00Z") },
			];

			const result = calculateLoginStreak(
				sessions,
				new Date("2025-06-15T12:00:00Z"),
			);

			expect(result).toBe(3);
		});

		it("should stop counting at the first gap", () => {
			const sessions: DashboardSessionRecord[] = [
				{ createdAt: new Date("2025-06-15T10:00:00Z") },
				{ createdAt: new Date("2025-06-14T10:00:00Z") },
				{ createdAt: new Date("2025-06-12T10:00:00Z") },
			];

			const result = calculateLoginStreak(
				sessions,
				new Date("2025-06-15T12:00:00Z"),
			);

			expect(result).toBe(2);
		});

		it("should return 0 for an empty sessions array", () => {
			const result = calculateLoginStreak([]);

			expect(result).toBe(0);
		});

		it("should use lastUsedAt when createdAt is undefined", () => {
			const sessions: DashboardSessionRecord[] = [
				{ lastUsedAt: new Date("2025-06-15T10:00:00Z") },
				{ lastUsedAt: new Date("2025-06-14T10:00:00Z") },
			];

			const result = calculateLoginStreak(
				sessions,
				new Date("2025-06-15T12:00:00Z"),
			);

			expect(result).toBe(2);
		});
	});

	describe("mapRecentActivityBooking", () => {
		it("should map SESSION_COMPLETED activity for a mentor", () => {
			const booking: DashboardBookingRecord = {
				_id: "b1",
				mentorId: "m1",
				menteeId: { name: "Jane" },
				startTime: new Date("2025-06-01T10:00:00Z"),
				endTime: new Date("2025-06-01T11:00:00Z"),
				status: "COMPLETED",
				paymentStatus: "COMPLETED",
				paymentType: "COINS",
				totalAmount: 1000,
				currency: "COINS",
				createdAt: new Date(),
				updatedAt: new Date("2025-06-01T11:30:00Z"),
			};

			const result = mapRecentActivityBooking(
				booking,
				"MENTOR",
				"SESSION_COMPLETED",
			);

			expect(result.type).toBe("SESSION_COMPLETED");
			expect(result.title).toContain("Session completed");
			expect(result.title).toContain("Jane");
			expect(result.occurredAt).toBe(
				new Date("2025-06-01T11:30:00Z").toISOString(),
			);
		});

		it("should map SESSION_BOOKED activity for a mentor", () => {
			const booking: DashboardBookingRecord = {
				_id: "b1",
				mentorId: "m1",
				menteeId: { name: "Jane" },
				startTime: new Date("2025-06-01T10:00:00Z"),
				endTime: new Date("2025-06-01T11:00:00Z"),
				status: "PENDING",
				paymentStatus: "PENDING",
				paymentType: "COINS",
				totalAmount: 1000,
				currency: "COINS",
				createdAt: new Date("2025-06-01T09:00:00Z"),
				updatedAt: new Date(),
			};

			const result = mapRecentActivityBooking(
				booking,
				"MENTOR",
				"SESSION_BOOKED",
			);

			expect(result.title).toContain("New session booked by");
			expect(result.occurredAt).toBe(
				new Date("2025-06-01T09:00:00Z").toISOString(),
			);
		});
	});

	describe("sortRecentActivity", () => {
		it("should sort by occurredAt descending and limit to provided count", () => {
			const activities = [
				{
					id: "1",
					type: "SESSION_BOOKED" as const,
					title: "Session 1",
					description: "",
					occurredAt: new Date("2025-06-01T10:00:00Z").toISOString(),
				},
				{
					id: "2",
					type: "SESSION_BOOKED" as const,
					title: "Session 2",
					description: "",
					occurredAt: new Date("2025-06-03T10:00:00Z").toISOString(),
				},
				{
					id: "3",
					type: "SESSION_BOOKED" as const,
					title: "Session 3",
					description: "",
					occurredAt: new Date("2025-06-02T10:00:00Z").toISOString(),
				},
			];

			const result = sortRecentActivity(activities, 2);

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe("2");
			expect(result[1].id).toBe("3");
		});

		it("should default to 3 items when limit is not provided", () => {
			const activities = Array.from({ length: 5 }, (_, i) => ({
				id: String(i),
				type: "SESSION_BOOKED" as const,
				title: `Session ${i}`,
				description: "",
				occurredAt: new Date(
					`2025-06-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
				).toISOString(),
			}));

			const result = sortRecentActivity(activities);

			expect(result).toHaveLength(3);
		});
	});

	describe("buildSessionGrowth", () => {
		it("should calculate growth between periods", () => {
			const bookings: DashboardBookingRecord[] = [
				{
					_id: "b1",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date("2025-06-10T10:00:00Z"),
					endTime: new Date("2025-06-10T11:00:00Z"),
					status: "COMPLETED",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					_id: "b2",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date("2025-06-11T10:00:00Z"),
					endTime: new Date("2025-06-11T11:00:00Z"),
					status: "COMPLETED",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					_id: "b3",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date("2025-05-10T10:00:00Z"),
					endTime: new Date("2025-05-10T11:00:00Z"),
					status: "COMPLETED",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const periodStart = new Date("2025-06-10T00:00:00Z");
			const periodEnd = new Date("2025-06-14T23:59:59Z");

			const result = buildSessionGrowth(
				bookings,
				periodStart,
				periodEnd,
				"MENTOR",
			);

			expect(result.current).toBe(2);
			expect(result.previous).toBe(0);
		});
	});

	describe("buildHoursGrowth", () => {
		it("should calculate growth in hours between periods", () => {
			const bookings: DashboardBookingRecord[] = [
				{
					_id: "b1",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date("2025-06-10T10:00:00Z"),
					endTime: new Date("2025-06-10T12:00:00Z"),
					status: "COMPLETED",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const periodStart = new Date("2025-06-10T00:00:00Z");
			const periodEnd = new Date("2025-06-14T23:59:59Z");

			const result = buildHoursGrowth(bookings, periodStart, periodEnd);

			expect(result.current).toBe(2);
			expect(result.previous).toBe(0);
		});
	});

	describe("getMonthRangeForNow", () => {
		it("should return UTC range for IST month", () => {
			const now = new Date("2025-06-15T12:00:00.000Z");

			const result = getMonthRangeForNow(now);

			expect(result.start).toBeDefined();
			expect(result.end).toBeDefined();
			expect(result.start.getTime()).toBeLessThan(result.end.getTime());
		});
	});

	describe("buildActivityOverview", () => {
		it("should build activity overview for a week period", () => {
			const now = new Date("2025-06-15T00:00:00.000Z");
			const bookings: DashboardBookingRecord[] = [
				{
					_id: "b1",
					mentorId: "m1",
					menteeId: "u1",
					startTime: new Date("2025-06-15T10:00:00Z"),
					endTime: new Date("2025-06-15T11:00:00Z"),
					status: "COMPLETED",
					paymentStatus: "COMPLETED",
					paymentType: "COINS",
					totalAmount: 1000,
					currency: "COINS",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const result = buildActivityOverview(bookings, "week", "USER", now);

			expect(result.period).toBe("week");
			expect(result.labels.length).toBe(7);
			expect(result.sessions.length).toBe(7);
			expect(result.hoursLearned.length).toBe(7);
			expect(result.earnings).toBeUndefined();
		});

		it("should include earnings array for MENTOR role", () => {
			const now = new Date("2025-06-15T00:00:00.000Z");
			const bookings: DashboardBookingRecord[] = [];

			const result = buildActivityOverview(bookings, "week", "MENTOR", now);

			expect(result.earnings).toBeDefined();
			expect(result.earnings?.length).toBe(7);
		});
	});
});
