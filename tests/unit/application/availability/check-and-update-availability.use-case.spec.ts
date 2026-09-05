import { beforeEach, describe, expect, it } from "vitest";
import { AvailabilityNotFoundError } from "../../../../src/application/modules/availability/errors/availability-not-found.error";
import { CheckAndUpdateAvailabilityUseCase } from "../../../../src/application/modules/availability/use-cases/check-and-update-availability.use-case";
import type { IUpdateAvailabilityUseCase } from "../../../../src/application/modules/availability/use-cases/update-availability.use-case.interface";
import { MentorNotFoundError } from "../../../../src/application/shared/errors/mentor-not-found.error";
import type { IAvailabilityRepository } from "../../../../src/domain/repositories/availability.repository.interface";
import type { IMentorWriteRepository } from "../../../../src/domain/repositories/mentor-write.repository.interface";
import { createAvailability } from "../../../factories/entities/availability.factory";
import { createMentor } from "../../../factories/entities/mentor.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("CheckAndUpdateAvailabilityUseCase", () => {
	let availabilityRepository: ReturnType<
		typeof createMock<IAvailabilityRepository>
	>;
	let mentorRepository: ReturnType<typeof createMock<IMentorWriteRepository>>;
	let updateAvailabilityUseCase: ReturnType<
		typeof createMock<IUpdateAvailabilityUseCase>
	>;
	let useCase: CheckAndUpdateAvailabilityUseCase;

	const baseInput = {
		userId: "user-1",
		availabilityId: "availability-1",
		startTime: "09:30",
		endTime: "12:00",
		breakTimes: [],
	};

	beforeEach(() => {
		availabilityRepository = createMock<IAvailabilityRepository>();
		mentorRepository = createMock<IMentorWriteRepository>();
		updateAvailabilityUseCase = createMock<IUpdateAvailabilityUseCase>();
		useCase = new CheckAndUpdateAvailabilityUseCase(
			availabilityRepository,
			mentorRepository,
			updateAvailabilityUseCase,
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

	it("should return conflicts without updating", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findById.mockResolvedValue(createAvailability());
		availabilityRepository.findByMentorId.mockResolvedValue([
			createAvailability({ id: "availability-1" }),
			createAvailability({
				id: "availability-2",
				name: "Overlapping",
				days: new Set(["Monday"]),
				startTime: "10:00",
				endTime: "13:00",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			}),
		]);

		const result = await useCase.execute(baseInput);

		expect(result).toEqual({
			updated: false,
			conflicts: [
				{
					name: "Overlapping",
					startDate: "2025-01-01",
					endDate: "2025-12-31",
					startTime: "10:00",
					endTime: "13:00",
				},
			],
		});
		expect(updateAvailabilityUseCase.execute).not.toHaveBeenCalled();
	});

	it("should update and return the mapped availability when there is no conflict", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findById.mockResolvedValue(createAvailability());
		availabilityRepository.findByMentorId.mockResolvedValue([
			createAvailability({ id: "availability-1" }),
		]);
		updateAvailabilityUseCase.execute.mockResolvedValue({
			availabilityId: "availability-1",
		});
		availabilityRepository.findById
			.mockResolvedValueOnce(createAvailability())
			.mockResolvedValueOnce(
				createAvailability({ id: "availability-1", startTime: "09:30" }),
			);

		const result = await useCase.execute(baseInput);

		expect(updateAvailabilityUseCase.execute).toHaveBeenCalledWith(baseInput);
		expect(result).toEqual({
			updated: true,
			availability: expect.objectContaining({
				id: "availability-1",
				startTime: "09:30",
			}),
		});
	});
});
