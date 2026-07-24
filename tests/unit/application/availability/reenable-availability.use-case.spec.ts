import { beforeEach, describe, expect, it } from "vitest";
import { ReenableAvailabilityUseCase } from "../../../../src/application/modules/availability/use-cases/reenable-availability.use-case";
import {
	AvailabilityNotFoundError,
	UnauthorizedAvailabilityActionError,
} from "../../../../src/application/modules/booking/errors/booking.errors";
import { MentorNotFoundError } from "../../../../src/application/shared/errors/mentor-not-found.error";
import type { IAvailabilityRepository } from "../../../../src/domain/repositories/availability.repository.interface";
import type { IMentorWriteRepository } from "../../../../src/domain/repositories/mentor-write.repository.interface";
import { createAvailability } from "../../../factories/entities/availability.factory";
import { createMentor } from "../../../factories/entities/mentor.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("ReenableAvailabilityUseCase", () => {
	let availabilityRepository: ReturnType<
		typeof createMock<IAvailabilityRepository>
	>;
	let mentorRepository: ReturnType<typeof createMock<IMentorWriteRepository>>;
	let useCase: ReenableAvailabilityUseCase;

	beforeEach(() => {
		availabilityRepository = createMock<IAvailabilityRepository>();
		mentorRepository = createMock<IMentorWriteRepository>();
		useCase = new ReenableAvailabilityUseCase(
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

	it("should throw when the availability is not found", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findById.mockResolvedValue(null);

		await expect(
			useCase.execute({ userId: "user-1", availabilityId: "availability-1" }),
		).rejects.toBeInstanceOf(AvailabilityNotFoundError);
	});

	it("should throw when the mentor does not own the availability", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findById.mockResolvedValue(
			createAvailability({ mentorId: "mentor-2", status: false }),
		);

		await expect(
			useCase.execute({ userId: "user-1", availabilityId: "availability-1" }),
		).rejects.toBeInstanceOf(UnauthorizedAvailabilityActionError);
	});

	it("should re-enable the availability", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findById.mockResolvedValue(
			createAvailability({ status: false }),
		);

		await useCase.execute({
			userId: "user-1",
			availabilityId: "availability-1",
		});

		expect(availabilityRepository.updateStatus).toHaveBeenCalledWith(
			"availability-1",
			true,
		);
	});
});
