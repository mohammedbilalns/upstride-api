import { beforeEach, describe, expect, it } from "vitest";
import { GetMentorsUseCase } from "../../../../../src/application/modules/mentor-discovery/use-cases/get-mentors.use-case";
import type { IStorageService } from "../../../../../src/application/services/storage.service.interface";
import type {
	IInterestRepository,
	IMentorListReadRepository,
} from "../../../../../src/domain/repositories";
import { createInterest } from "../../../../factories/entities/interest.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("GetMentorsUseCase", () => {
	let mentorRepository: ReturnType<
		typeof createMock<IMentorListReadRepository>
	>;
	let interestRepository: ReturnType<typeof createMock<IInterestRepository>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: GetMentorsUseCase;

	beforeEach(() => {
		mentorRepository = createMock<IMentorListReadRepository>();
		interestRepository = createMock<IInterestRepository>();
		storageService = createMock<IStorageService>();

		useCase = new GetMentorsUseCase(
			mentorRepository,
			interestRepository,
			storageService,
		);

		storageService.getPublicUrl.mockImplementation(
			(key: string) => `https://storage.example.com/${key}`,
		);
	});

	it("should return empty result when specified category does not exist", async () => {
		interestRepository.query.mockResolvedValue([]);

		const result = await useCase.execute({
			category: "NonExistent",
			page: 1,
			limit: 10,
		});

		expect(interestRepository.query).toHaveBeenCalledWith({
			query: { name: "NonExistent" },
		});
		expect(result.items).toEqual([]);
		expect(result.total).toBe(0);
	});

	it("should query discoverable mentors with category ID and sort options", async () => {
		const interest = createInterest({ id: "cat-1", name: "Engineering" });
		interestRepository.query.mockResolvedValue([interest]);

		const mockMentorListItem = {
			id: "mentor-1",
			user: { name: "John", profilePictureId: "pic-1" },
			currentRoleDetails: { name: "Senior Lead" },
			expertisesDetails: [],
			skillsDetails: [],
		};

		mentorRepository.paginateDiscoverable.mockResolvedValue({
			items: [mockMentorListItem as unknown as any],
			total: 1,
			page: 1,
			limit: 10,
			totalPages: 1,
		});

		const result = await useCase.execute({
			category: "Engineering",
			sort: "recent",
			page: 1,
			limit: 10,
		});

		expect(mentorRepository.paginateDiscoverable).toHaveBeenCalledWith({
			page: 1,
			limit: 10,
			query: expect.objectContaining({
				categoryId: "cat-1",
			}),
			sort: { createdAt: -1 },
		});
		expect(result.items).toHaveLength(1);
		expect(result.items[0].avatar).toBe("https://storage.example.com/pic-1");
	});
});
