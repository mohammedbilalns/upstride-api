import { isValidTimeRange, toMinutes } from "../../shared/utilities/time.util";
import { EntityValidationError } from "../errors";
import { validateBreaks } from "../utilties/validate-availability-breaktime";

export interface BreakTime {
	startTime: string;
	endTime: string;
}

const Day = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
] as const;
export type Day = (typeof Day)[number];

const SlotDuration = [30, 60] as const;
export type SlotDuration = (typeof SlotDuration)[number];

export class Availability {
	constructor(
		public readonly id: string,
		public readonly mentorId: string,
		public readonly name: string,
		public readonly description: string,
		public readonly days: Set<Day>,
		public readonly startTime: string,
		public readonly endTime: string,
		public readonly startDate: string,
		public readonly endDate: string,
		public readonly breakTimes: BreakTime[],
		public readonly slotDuration: SlotDuration,
		public readonly bufferTime: number,
		public readonly status: boolean,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}

	static create(
		data: Omit<Availability, "id" | "createdAt" | "updatedAt">,
	): Omit<Availability, "id" | "createdAt" | "updatedAt"> {
		if (data.days.size === 0) {
			throw new EntityValidationError(
				"Availability",
				"Atleast one day must be selected",
			);
		}

		if (!isValidTimeRange(data.startTime, data.endTime)) {
			throw new EntityValidationError("Availability", "Invalid time range");
		}

		if (toMinutes(data.endTime) - toMinutes(data.startTime) < 60) {
			throw new EntityValidationError(
				"Availability",
				"Availability must be at least 1 hour",
			);
		}

		if (new Date(data.startDate) >= new Date(data.endDate)) {
			throw new EntityValidationError(
				"Availability",
				"startDate must be before endDate",
			);
		}

		if (data.bufferTime < 5 || data.bufferTime > 60) {
			throw new EntityValidationError(
				"Availability",
				"Buffer time must be between 5 and 60 minutes",
			);
		}

		if (data.bufferTime >= data.slotDuration) {
			throw new EntityValidationError(
				"Availability",
				"Buffer time must be less than slot duration",
			);
		}

		const breakValidationError = validateBreaks(
			data.breakTimes,
			data.startTime,
			data.endTime,
		);

		if (breakValidationError) {
			throw new EntityValidationError("Availability", breakValidationError);
		}

		return data;
	}
}
