import { inject, injectable } from "inversify";
import { TYPES } from "../../../../shared/types/types";
import type { BookingJobQueuePort } from "../../../ports/booking-job-queue.port";
import type {
	IScheduleSessionSettlementUseCase,
	ScheduleSessionSettlementInput,
} from "./schedule-session-settlement.use-case.interface";

@injectable()
export class ScheduleSessionSettlementUseCase
	implements IScheduleSessionSettlementUseCase
{
	constructor(
		@inject(TYPES.Services.BookingJobQueue)
		private readonly _jobQueue: BookingJobQueuePort,
	) {}

	async execute(input: ScheduleSessionSettlementInput): Promise<void> {
		const delay = input.endTime.getTime() + 5 * 60 * 1000 - Date.now();

		await this._jobQueue.enqueue(
			"settle-ended-session",
			{ bookingId: input.bookingId },
			{
				delay: Math.max(delay, 0),
				jobId: input.bookingId,
			},
		);
	}
}
