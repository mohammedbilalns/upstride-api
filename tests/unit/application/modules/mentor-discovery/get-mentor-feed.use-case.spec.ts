import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserNotFoundError } from "../../../../../src/application/modules/authentication/errors";
import { GetMentorFeedUseCase } from "../../../../../src/application/modules/mentor-discovery/use-cases/get-mentor-feed.use-case";
import type { IFeedCacheService } from "../../../../../src/application/services";
import type { IStorageService } from "../../../../../src/application/services/storage.service.interface";
import type {
	IMentorProfileReadRepository,
	IUserRepository,
} from "../../../../../src/domain/repositories";
import type { MentorProfileDetails } from "../../../../../src/domain/repositories/mentor.repository.types";
import type { MentorForFeed } from "../../../../../src/shared/utilities/feed-scoring.util";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

vi.mock("../../../../../src/shared/utilities/feed-scoring.util", () => ({
	computeMentorFeed: vi.fn().mockReturnValue(["mentor-1", "mentor-2"]),
}));

describe("GetMentorFeedUseCase", () => {
	let mentorProfileReadRepository: ReturnType<
		typeof createMock<IMentorProfileReadRepository>
	>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let feedCacheService: ReturnType<typeof createMock<IFeedCacheService>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: GetMentorFeedUseCase;

	beforeEach(() => {
		mentorProfileReadRepository = createMock<IMentorProfileReadRepository>();
		userRepository = createMock<IUserRepository>();
		feedCacheService = createMock<IFeedCacheService>();
		storageService = createMock<IStorageService>();

		useCase = new GetMentorFeedUseCase(
			mentorProfileReadRepository,
			userRepository,
			feedCacheService,
			storageService,
		);

		storageService.getPublicUrl.mockImplementation(
			(key: string) => `https://storage.example.com/${key}`,
		);
	});

	it("should throw UserNotFoundError when user does not exist", async () => {
		userRepository.findById.mockResolvedValue(null);

		await expect(
			useCase.execute({ userId: "non-existent", page: 1, limit: 10 }),
		).rejects.toBeInstanceOf(UserNotFoundError);
	});

	it("should return empty result when user has no interest preferences", async () => {
		const mockUser = createUser({
			id: "user-1",
			preferences: { interests: [], skills: [] },
		});
		userRepository.findById.mockResolvedValue(mockUser);

		const result = await useCase.execute({
			userId: "user-1",
			page: 1,
			limit: 10,
		});

		expect(result.items).toEqual([]);
		expect(result.total).toBe(0);
	});

	it("should compute feed and cache it when cache is empty", async () => {
		const mockUser = createUser({
			id: "user-1",
			preferences: { interests: ["Tech"], skills: [] },
		});
		userRepository.findById.mockResolvedValue(mockUser);
		feedCacheService.get.mockReturnValue(null);
		mentorProfileReadRepository.findFeedCandidates.mockResolvedValue([
			{
				id: "mentor-1",
				interests: ["Tech"],
				rating: 4.8,
				totalSessions: 10,
				lastSessionAt: new Date("2026-07-20T00:00:00.000Z"),
			},
			{
				id: "mentor-2",
				interests: ["Tech"],
				rating: 4.5,
				totalSessions: 8,
				lastSessionAt: new Date("2026-07-18T00:00:00.000Z"),
			},
		] as MentorForFeed[]);

		const mockMentorProfile = {
			id: "mentor-1",
			userId: "user-mentor-1",
			isApproved: true,
			isUserBlocked: false,
			bio: "Bio",
			user: { name: "Mentor One", profilePictureId: "pic-1" },
			currentRoleDetails: { name: "Dev" },
			expertisesDetails: [{ id: "exp-1", name: "Backend" }],
			skillsDetails: [
				{
					skillId: { id: "sk-1", name: "Node", interestId: "int-1" },
					level: "ADVANCED",
				},
			],
		} as MentorProfileDetails;

		mentorProfileReadRepository.findProfileById.mockImplementation(
			async (id: string) => {
				if (id === "mentor-1") return mockMentorProfile;
				return null;
			},
		);

		const result = await useCase.execute({
			userId: "user-1",
			page: 1,
			limit: 10,
		});

		expect(feedCacheService.set).toHaveBeenCalledWith("feed:mentors:user-1", [
			"mentor-1",
			"mentor-2",
		]);
		expect(result.items).toHaveLength(1);
		expect(result.items[0].id).toBe("mentor-1");
		expect(result.items[0].avatar).toBe("https://storage.example.com/pic-1");
	});

	it("should return empty items when pageIds array is empty (out of page bounds)", async () => {
		const mockUser = createUser({
			id: "user-1",
			preferences: { interests: ["Tech"], skills: [] },
		});
		userRepository.findById.mockResolvedValue(mockUser);
		feedCacheService.get.mockReturnValue(["mentor-1"]);

		const result = await useCase.execute({
			userId: "user-1",
			page: 5,
			limit: 10,
		});

		expect(result.items).toEqual([]);
		expect(result.total).toBe(1);
	});
});
