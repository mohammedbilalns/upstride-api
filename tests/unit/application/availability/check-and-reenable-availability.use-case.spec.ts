import { beforeEach, describe, expect, it } from "vitest";
import { CheckAndReenableAvailabilityUseCase } from "../../../../src/application/modules/availability/use-cases/check-and-reenable-availability.use-case";
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

describe("CheckAndReenableAvailabilityUseCase", () => {
	let availabilityRepository: ReturnType<
		typeof createMock<IAvailabilityRepository>
	>;
	let mentorRepository: ReturnType<typeof createMock<IMentorWriteRepository>>;
	let useCase: CheckAndReenableAvailabilityUseCase;

	beforeEach(() => {
		availabilityRepository = createMock<IAvailabilityRepository>();
		mentorRepository = createMock<IMentorWriteRepository>();
		useCase = new CheckAndReenableAvailabilityUseCase(
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

	it("should return enabled when the availability is already active", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findById.mockResolvedValue(createAvailability());

		const result = await useCase.execute({
			userId: "user-1",
			availabilityId: "availability-1",
		});

		expect(result).toEqual({ enabled: true });
		expect(availabilityRepository.findByMentorId).not.toHaveBeenCalled();
	});

	it("should return conflicts without enabling", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findById.mockResolvedValue(
			createAvailability({ status: false }),
		);
		availabilityRepository.findByMentorId.mockResolvedValue([
			createAvailability({
				id: "availability-2",
				name: "Overlap",
				days: new Set(["Monday"]),
				startTime: "10:00",
				endTime: "15:00",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			}),
		]);

		const result = await useCase.execute({
			userId: "user-1",
			availabilityId: "availability-1",
		});

		expect(result).toEqual({
			enabled: false,
			conflicts: [
				{
					name: "Overlap",
					startDate: "2025-01-01",
					endDate: "2025-12-31",
					startTime: "10:00",
					endTime: "15:00",
				},
			],
		});
		expect(availabilityRepository.updateStatus).not.toHaveBeenCalled();
	});

	it("should enable the availability when there is no conflict", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findById.mockResolvedValue(
			createAvailability({ status: false }),
		);
		availabilityRepository.findByMentorId.mockResolvedValue([]);

		const result = await useCase.execute({
			userId: "user-1",
			availabilityId: "availability-1",
		});

		expect(result).toEqual({ enabled: true });
		expect(availabilityRepository.updateStatus).toHaveBeenCalledWith(
			"availability-1",
			true,
		);
	});
});
