import {
	Availability,
	type BreakTime,
} from "../../../src/domain/entities/availability.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createAvailability(
	overrides: Partial<Availability> = {},
): Availability {
	const data = mergeDefaults<Availability>(
		{
			id: "availability-1",
			mentorId: "mentor-1",
			name: "Weekdays",
			description: "Regular working hours",
			days: new Set(["Monday", "Tuesday", "Wednesday"]),
			startTime: "09:00",
			endTime: "17:00",
			startDate: "2025-01-01",
			endDate: "2025-12-31",
			breakTimes: [
				{
					startTime: "12:00",
					endTime: "13:00",
				},
			] satisfies BreakTime[],
			slotDuration: 60,
			bufferTime: 10,
			status: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		overrides,
	);

	return new Availability(
		data.id,
		data.mentorId,
		data.name,
		data.description,
		data.days,
		data.startTime,
		data.endTime,
		data.startDate,
		data.endDate,
		data.breakTimes,
		data.slotDuration,
		data.bufferTime,
		data.status,
		data.createdAt,
		data.updatedAt,
	);
}
