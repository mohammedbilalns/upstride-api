import { beforeEach, describe, expect, it } from "vitest";
import type { UpdateAvailabilityInput } from "../../../../src/application/modules/availability/dtos/availability.dto";
import { AvailabilityNotFoundError } from "../../../../src/application/modules/availability/errors/availability-not-found.error";
import { UpdateAvailabilityUseCase } from "../../../../src/application/modules/availability/use-cases/update-availability.use-case";
import { MentorNotFoundError } from "../../../../src/application/shared/errors/mentor-not-found.error";
import type { IAvailabilityRepository } from "../../../../src/domain/repositories/availability.repository.interface";
import type { IMentorWriteRepository } from "../../../../src/domain/repositories/mentor-write.repository.interface";
import { createAvailability } from "../../../factories/entities/availability.factory";
import { createMentor } from "../../../factories/entities/mentor.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("UpdateAvailabilityUseCase", () => {
	let availabilityRepository: ReturnType<
		typeof createMock<IAvailabilityRepository>
	>;
	let mentorRepository: ReturnType<typeof createMock<IMentorWriteRepository>>;
	let useCase: UpdateAvailabilityUseCase;

	const baseInput: UpdateAvailabilityInput = {
		userId: "user-1",
		availabilityId: "availability-1",
		name: "Updated rule",
		days: ["Thursday"],
		startTime: "10:00",
	};

	beforeEach(() => {
		availabilityRepository = createMock<IAvailabilityRepository>();
		mentorRepository = createMock<IMentorWriteRepository>();
		useCase = new UpdateAvailabilityUseCase(
			availabilityRepository,
			mentorRepository,
		);
	});

	it("should throw when the mentor is not found", async () => {
		mentorRepository.findByUserId.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			MentorNotFoundError,
		);
	});

	it("should throw when the availability does not belong to the mentor", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findById.mockResolvedValue(
			createAvailability({ mentorId: "mentor-2" }),
		);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			AvailabilityNotFoundError,
		);
	});

	it("should throw when the update result is null", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findById.mockResolvedValue(createAvailability());
		availabilityRepository.updateById.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			AvailabilityNotFoundError,
		);
	});

	it("should update only the provided fields", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findById.mockResolvedValue(createAvailability());
		availabilityRepository.updateById.mockResolvedValue(
			createAvailability({ id: "availability-1", name: "Updated rule" }),
		);

		const result = await useCase.execute(baseInput);

		expect(availabilityRepository.updateById).toHaveBeenCalledWith(
			"availability-1",
			expect.objectContaining({
				name: "Updated rule",
				days: new Set(["Thursday"]),
				startTime: "10:00",
			}),
		);
		expect(result).toEqual({ availabilityId: "availability-1" });
	});
});
