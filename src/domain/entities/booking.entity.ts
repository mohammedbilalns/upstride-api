import { EntityValidationError } from "../errors";

const BookingStatus = [
	"CANCELLED_BY_MENTEE",
	"CANCELLED_BY_MENTOR",
	"CONFIRMED",
	"PENDING",
	"SLOT_TAKEN_BY_ANOTHER_USER",
	"STARTED",
	"COMPLETED",
] as const;
export type BookingStatus = (typeof BookingStatus)[number];

const PaymentType = ["COINS", "STRIPE"] as const;
export type PaymentType = (typeof PaymentType)[number];

const PaymentStatus = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PaymentStatus)[number];

type CreateBookingData = {
	mentorId: string;
	menteeId: string;
	startTime: string;
	endTime: string;
	meetingLink: string;
	paymentType: PaymentType;
	paymentStatus: PaymentStatus;
	totalAmount: number;
	currency: string;
	notes?: string;
};

export class Booking {
	constructor(
		public readonly id: string,
		public readonly mentorId: string,
		public readonly mentorUserId: string | null,
		public readonly menteeId: string,
		public readonly startTime: string,
		public readonly endTime: string,
		public readonly status: BookingStatus,
		public readonly meetingLink: string,
		public readonly paymentType: PaymentType,
		public readonly paymentStatus: PaymentStatus,
		public readonly totalAmount: number,
		public readonly currency: string,
		public readonly notes: string | null,
		public readonly menteeName: string | null,
		public readonly mentorName: string | null,
		public readonly mentorJoinedAt: Date | null,
		public readonly settledAt: Date | null,
		public readonly feedback: string | null,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}

	static create(data: CreateBookingData) {
		if (data.mentorId === data.menteeId) {
			throw new EntityValidationError(
				"Booking",
				"Mentor and Mentee cannot be the same",
			);
		}

		const start = new Date(data.startTime);
		const end = new Date(data.endTime);
		if (
			Number.isNaN(start.getTime()) ||
			Number.isNaN(end.getTime()) ||
			start.getTime() >= end.getTime()
		) {
			throw new EntityValidationError("Booking", "Invalid time range");
		}
		if (start.getTime() <= Date.now()) {
			throw new EntityValidationError("Booking", "Booking time is in the past");
		}

		return {
			mentorId: data.mentorId,
			menteeId: data.menteeId,
			startTime: data.startTime,
			endTime: data.endTime,
			meetingLink: data.meetingLink,
			paymentType: data.paymentType,
			paymentStatus: data.paymentStatus,
			totalAmount: data.totalAmount,
			currency: data.currency,
			notes: data.notes,
		};
	}

	/**
	 * Asserts that the booker is not booking their own session slot.
	 */
	static assertCanBook(bookerUserId: string, mentorUserId: string): void {
		if (bookerUserId === mentorUserId) {
			throw new EntityValidationError(
				"Booking",
				"You cannot book your own session.",
			);
		}
	}

	/**
	 * Asserts that the booking is in a state that allows cancellation.
	 */
	static assertCancellable(status: BookingStatus): void {
		if (status !== "PENDING" && status !== "CONFIRMED") {
			throw new EntityValidationError(
				"Booking",
				"Only pending or confirmed bookings can be cancelled.",
			);
		}
	}

	/**
	 * Asserts that the booking can still be rescheduled given a minimum
	 */
	assertReschedulable(windowHours: number): void {
		const windowMs = windowHours * 60 * 60 * 1000;
		if (new Date(this.startTime).getTime() - Date.now() < windowMs) {
			throw new EntityValidationError(
				"Booking",
				`Cannot reschedule within ${windowHours} hours of the session start.`,
			);
		}
	}
}
