import { beforeEach, describe, expect, it } from "vitest";
import type { CreateAvailabilityInput } from "../../../../src/application/modules/availability/dtos/availability.dto";
import { CheckAndCreateAvailabilityUseCase } from "../../../../src/application/modules/availability/use-cases/check-and-create-availability.use-case";
import type { ICreateAvailabilityUseCase } from "../../../../src/application/modules/availability/use-cases/create-availability.use-case.interface";
import { MentorNotFoundError } from "../../../../src/application/shared/errors/mentor-not-found.error";
import type { IAvailabilityRepository } from "../../../../src/domain/repositories/availability.repository.interface";
import type { IMentorWriteRepository } from "../../../../src/domain/repositories/mentor-write.repository.interface";
import { createAvailability } from "../../../factories/entities/availability.factory";
import { createMentor } from "../../../factories/entities/mentor.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("CheckAndCreateAvailabilityUseCase", () => {
	let availabilityRepository: ReturnType<
		typeof createMock<IAvailabilityRepository>
	>;
	let mentorRepository: ReturnType<typeof createMock<IMentorWriteRepository>>;
	let createAvailabilityUseCase: ReturnType<
		typeof createMock<ICreateAvailabilityUseCase>
	>;
	let useCase: CheckAndCreateAvailabilityUseCase;

	const baseInput: CreateAvailabilityInput = {
		userId: "user-1",
		name: "Weekdays",
		description: "Regular hours",
		days: ["Monday", "Tuesday"],
		startTime: "09:00",
		endTime: "17:00",
		startDate: "2026-08-01",
		endDate: "2026-12-31",
		breakTimes: [] as { startTime: string; endTime: string }[],
		slotDuration: 60 as const,
		bufferTime: 10,
	};

	beforeEach(() => {
		availabilityRepository = createMock<IAvailabilityRepository>();
		mentorRepository = createMock<IMentorWriteRepository>();
		createAvailabilityUseCase = createMock<ICreateAvailabilityUseCase>();
		useCase = new CheckAndCreateAvailabilityUseCase(
			availabilityRepository,
			mentorRepository,
			createAvailabilityUseCase,
		);
	});

	it("should throw when the mentor is not found", async () => {
		mentorRepository.findByUserId.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			MentorNotFoundError,
		);
	});

	it("should return conflicts without creating", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findByMentorId.mockResolvedValue([
			createAvailability({
				id: "availability-2",
				name: "Existing",
				days: new Set(["Monday"]),
				startTime: "10:00",
				endTime: "15:00",
				startDate: "2026-08-10",
				endDate: "2026-09-10",
			}),
		]);

		const result = await useCase.execute(baseInput);

		expect(result).toEqual({
			created: false,
			conflicts: [
				{
					name: "Existing",
					startDate: "2026-08-10",
					endDate: "2026-09-10",
					startTime: "10:00",
					endTime: "15:00",
				},
			],
		});
		expect(createAvailabilityUseCase.execute).not.toHaveBeenCalled();
	});

	it("should create and return the mapped availability when there is no conflict", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findByMentorId.mockResolvedValue([]);
		createAvailabilityUseCase.execute.mockResolvedValue({
			availabilityId: "availability-1",
		});
		availabilityRepository.findById.mockResolvedValue(
			createAvailability({
				id: "availability-1",
				days: new Set(["Monday", "Tuesday"]),
				startDate: "2026-08-01",
				endDate: "2026-12-31",
			}),
		);

		const result = await useCase.execute(baseInput);

		expect(createAvailabilityUseCase.execute).toHaveBeenCalledWith(baseInput);
		expect(result).toEqual({
			created: true,
			availability: expect.objectContaining({
				id: "availability-1",
				mentorId: "mentor-1",
				days: ["Monday", "Tuesday"],
			}),
		});
	});
});
