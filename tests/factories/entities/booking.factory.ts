import { Booking } from "../../../src/domain/entities/booking.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createBooking(overrides: Partial<Booking> = {}): Booking {
	const data = mergeDefaults<Booking>(
		{
			id: "booking-1",
			mentorId: "mentor-1",
			mentorUserId: "mentor-user-1",
			menteeId: "user-1",
			startTime: "2030-01-01T10:00:00.000Z",
			endTime: "2030-01-01T11:00:00.000Z",
			status: "CONFIRMED",
			meetingLink: "https://meet.example.com/booking-1",
			paymentType: "STRIPE",
			paymentStatus: "COMPLETED",
			totalAmount: 1000,
			currency: "INR",
			notes: null,
			menteeName: "Test User",
			mentorName: "Test Mentor",
			mentorJoinedAt: null,
			settledAt: null,
			feedback: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		overrides,
	);

	return new Booking(
		data.id,
		data.mentorId,
		data.mentorUserId,
		data.menteeId,
		data.startTime,
		data.endTime,
		data.status,
		data.meetingLink,
		data.paymentType,
		data.paymentStatus,
		data.totalAmount,
		data.currency,
		data.notes,
		data.menteeName,
		data.mentorName,
		data.mentorJoinedAt,
		data.settledAt,
		data.feedback,
		data.createdAt,
		data.updatedAt,
	);
}
