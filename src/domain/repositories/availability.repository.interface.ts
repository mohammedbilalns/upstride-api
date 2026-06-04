import type { Availability } from "../entities/availability.entity";
import type {
	CreatableRepository,
	FindByIdRepository,
	UpdatableByIdRepository,
} from "./capabilities";

export interface IAvailabilityRepository
	extends CreatableRepository<Availability>,
		FindByIdRepository<Availability>,
		UpdatableByIdRepository<Availability> {
	findByMentorId(
		mentorId: string,
		options?: {
			status?: boolean;
			expired?: boolean;
			page?: number;
			limit?: number;
		},
	): Promise<Availability[]>;
	countByMentorId(
		mentorId: string,
		options?: { status?: boolean; expired?: boolean },
	): Promise<number>;

	findActiveByMentorIdAndDate(
		mentorId: string,
		date: Date,
	): Promise<Availability[]>;
	updateStatus(id: string, status: boolean): Promise<void>;
	deleteById(id: string): Promise<void>;
}
