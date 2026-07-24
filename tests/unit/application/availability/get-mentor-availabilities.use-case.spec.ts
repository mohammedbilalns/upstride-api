import { beforeEach, describe, expect, it } from "vitest";
import { GetMentorAvailabilitiesUseCase } from "../../../../src/application/modules/availability/use-cases/get-mentor-availabilities.use-case";
import { MentorNotFoundError } from "../../../../src/application/shared/errors/mentor-not-found.error";
import type { IAvailabilityRepository } from "../../../../src/domain/repositories/availability.repository.interface";
import type { IMentorWriteRepository } from "../../../../src/domain/repositories/mentor-write.repository.interface";
import { createAvailability } from "../../../factories/entities/availability.factory";
import { createMentor } from "../../../factories/entities/mentor.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetMentorAvailabilitiesUseCase", () => {
	let availabilityRepository: ReturnType<
		typeof createMock<IAvailabilityRepository>
	>;
	let mentorRepository: ReturnType<typeof createMock<IMentorWriteRepository>>;
	let useCase: GetMentorAvailabilitiesUseCase;

	beforeEach(() => {
		availabilityRepository = createMock<IAvailabilityRepository>();
		mentorRepository = createMock<IMentorWriteRepository>();
		useCase = new GetMentorAvailabilitiesUseCase(
			availabilityRepository,
			mentorRepository,
		);
	});

	it("should throw when the mentor is not found", async () => {
		mentorRepository.findByUserId.mockResolvedValue(null);

		await expect(useCase.execute({ userId: "user-1" })).rejects.toBeInstanceOf(
			MentorNotFoundError,
		);
	});

	it("should fetch availabilities for the mentor without pagination by default", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findByMentorId.mockResolvedValue([
			createAvailability({ id: "availability-1", status: true }),
		]);

		const result = await useCase.execute({
			userId: "user-1",
			status: "active",
			expired: false,
		});

		expect(availabilityRepository.findByMentorId).toHaveBeenCalledWith(
			"mentor-1",
			{
				status: true,
				expired: false,
				page: 1,
				limit: 0,
			},
		);
		expect(result).toEqual({
			availabilities: [
				expect.objectContaining({
					id: "availability-1",
					status: true,
				}),
			],
			pagination: undefined,
		});
	});

	it("should fallback to legacy userId when mentorId returns no records", async () => {
		mentorRepository.findByUserId.mockResolvedValue(
			createMentor({ id: "mentor-1", userId: "legacy-user-1" }),
		);
		availabilityRepository.findByMentorId
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([
				createAvailability({ mentorId: "legacy-user-1" }),
			]);

		const result = await useCase.execute({
			userId: "user-1",
			status: "active",
		});

		expect(availabilityRepository.findByMentorId).toHaveBeenNthCalledWith(
			1,
			"mentor-1",
			{
				status: true,
				expired: undefined,
				page: 1,
				limit: 0,
			},
		);
		expect(availabilityRepository.findByMentorId).toHaveBeenNthCalledWith(
			2,
			"legacy-user-1",
			{
				status: true,
				expired: undefined,
				page: 1,
				limit: 0,
			},
		);
		expect(result.availabilities).toHaveLength(1);
		expect(result.availabilities[0].mentorId).toBe("legacy-user-1");
	});

	it("should include pagination when a limit is provided", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		availabilityRepository.findByMentorId.mockResolvedValue([
			createAvailability({ id: "availability-1" }),
			createAvailability({ id: "availability-2" }),
		]);
		availabilityRepository.countByMentorId.mockResolvedValue(5);

		const result = await useCase.execute({
			userId: "user-1",
			status: "disabled",
			expired: true,
			page: 2,
			limit: 2,
		});

		expect(availabilityRepository.countByMentorId).toHaveBeenCalledWith(
			"mentor-1",
			{ status: false, expired: true },
		);
		expect(result.pagination).toEqual({
			page: 2,
			limit: 2,
			totalCount: 5,
			totalPages: 3,
		});
	});
});
