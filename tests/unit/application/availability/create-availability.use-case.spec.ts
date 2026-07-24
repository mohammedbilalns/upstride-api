import { beforeEach, describe, expect, it } from "vitest";
import type { CreateAvailabilityInput } from "../../../../src/application/modules/availability/dtos/availability.dto";
import { CreateAvailabilityUseCase } from "../../../../src/application/modules/availability/use-cases/create-availability.use-case";
import { MentorNotFoundError } from "../../../../src/application/shared/errors/mentor-not-found.error";
import { EntityValidationError } from "../../../../src/domain/errors";
import type { IAvailabilityRepository } from "../../../../src/domain/repositories/availability.repository.interface";
import type { IMentorWriteRepository } from "../../../../src/domain/repositories/mentor-write.repository.interface";
import { createAvailability } from "../../../factories/entities/availability.factory";
import { createMentor } from "../../../factories/entities/mentor.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("CreateAvailabilityUseCase", () => {
	let availabilityRepository: ReturnType<
		typeof createMock<IAvailabilityRepository>
	>;
	let mentorRepository: ReturnType<typeof createMock<IMentorWriteRepository>>;
	let useCase: CreateAvailabilityUseCase;

	const baseInput: CreateAvailabilityInput = {
		userId: "user-1",
		name: "Weekdays",
		description: "Regular hours",
		days: ["Monday", "Tuesday"],
		startTime: "09:00",
		endTime: "17:00",
		startDate: "2026-08-01",
		endDate: "2026-12-31",
		breakTimes: [{ startTime: "12:00", endTime: "13:00" }],
		slotDuration: 60 as const,
		bufferTime: 10,
	};

	beforeEach(() => {
		availabilityRepository = createMock<IAvailabilityRepository>();
		mentorRepository = createMock<IMentorWriteRepository>();
		useCase = new CreateAvailabilityUseCase(
			availabilityRepository,
			mentorRepository,
		);
	});

	it("should throw when the mentor is not found", async () => {
		mentorRepository.findByUserId.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			MentorNotFoundError,
		);
		expect(availabilityRepository.create).not.toHaveBeenCalled();
	});

	it("should validate the input before persisting", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());

		await expect(
			useCase.execute({ ...baseInput, days: [] }),
		).rejects.toBeInstanceOf(EntityValidationError);
		expect(availabilityRepository.create).not.toHaveBeenCalled();
	});

	it("should create an availability for the mentor", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.create.mockResolvedValue(
			createAvailability({ id: "availability-1" }),
		);

		const result = await useCase.execute(baseInput);

		expect(availabilityRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				mentorId: "mentor-1",
				name: "Weekdays",
				description: "Regular hours",
				days: new Set(["Monday", "Tuesday"]),
				startTime: "09:00",
				endTime: "17:00",
				startDate: "2026-08-01",
				endDate: "2026-12-31",
				slotDuration: 60,
				bufferTime: 10,
				status: true,
			}),
		);
		expect(result).toEqual({ availabilityId: "availability-1" });
	});
});
