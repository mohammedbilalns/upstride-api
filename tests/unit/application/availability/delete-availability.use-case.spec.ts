import { beforeEach, describe, expect, it } from "vitest";
import { AvailabilityNotFoundError } from "../../../../src/application/modules/availability/errors/availability-not-found.error";
import { DeleteAvailabilityUseCase } from "../../../../src/application/modules/availability/use-cases/delete-availability.use-case";
import { MentorNotFoundError } from "../../../../src/application/shared/errors/mentor-not-found.error";
import type { IAvailabilityRepository } from "../../../../src/domain/repositories/availability.repository.interface";
import type { IMentorWriteRepository } from "../../../../src/domain/repositories/mentor-write.repository.interface";
import { createAvailability } from "../../../factories/entities/availability.factory";
import { createMentor } from "../../../factories/entities/mentor.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("DeleteAvailabilityUseCase", () => {
	let availabilityRepository: ReturnType<
		typeof createMock<IAvailabilityRepository>
	>;
	let mentorRepository: ReturnType<typeof createMock<IMentorWriteRepository>>;
	let useCase: DeleteAvailabilityUseCase;

	beforeEach(() => {
		availabilityRepository = createMock<IAvailabilityRepository>();
		mentorRepository = createMock<IMentorWriteRepository>();
		useCase = new DeleteAvailabilityUseCase(
			availabilityRepository,
			mentorRepository,
		);
	});

	it("should throw when the mentor is not found", async () => {
		mentorRepository.findByUserId.mockResolvedValue(null);

		await expect(
			useCase.execute({ userId: "user-1", availabilityId: "availability-1" }),
		).rejects.toBeInstanceOf(MentorNotFoundError);
	});

	it("should throw when the availability does not belong to the mentor", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findById.mockResolvedValue(
			createAvailability({ mentorId: "mentor-2" }),
		);

		await expect(
			useCase.execute({ userId: "user-1", availabilityId: "availability-1" }),
		).rejects.toBeInstanceOf(AvailabilityNotFoundError);
	});

	it("should delete the availability", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findById.mockResolvedValue(createAvailability());

		await useCase.execute({
			userId: "user-1",
			availabilityId: "availability-1",
		});

		expect(availabilityRepository.deleteById).toHaveBeenCalledWith(
			"availability-1",
		);
	});
});
