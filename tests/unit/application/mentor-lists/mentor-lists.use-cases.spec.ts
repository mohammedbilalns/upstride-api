import { beforeEach, describe, expect, it } from "vitest";
import {
	MentorAlreadySavedError,
	MentorListNotFoundError,
} from "../../../../src/application/modules/mentor-lists/errors";
import { AddMentorToListUseCase } from "../../../../src/application/modules/mentor-lists/use-cases/add-mentor-to-list.use-case";
import { CreateMentorListUseCase } from "../../../../src/application/modules/mentor-lists/use-cases/create-mentor-list.use-case";
import { DeleteMentorListUseCase } from "../../../../src/application/modules/mentor-lists/use-cases/delete-mentor-list.use-case";
import { GetMentorListUseCase } from "../../../../src/application/modules/mentor-lists/use-cases/get-mentor-list.use-case";
import { GetMentorListsUseCase } from "../../../../src/application/modules/mentor-lists/use-cases/get-mentor-lists.use-case";
import { RemoveMentorFromListUseCase } from "../../../../src/application/modules/mentor-lists/use-cases/remove-mentor-from-list.use-case";
import type { IIdGenerator } from "../../../../src/application/services/id-generator.service.interface";
import { MentorNotFoundError } from "../../../../src/application/shared/errors/mentor-not-found.error";
import { EntityValidationError } from "../../../../src/domain/errors";
import type { IMentorListRepository } from "../../../../src/domain/repositories/mentor-list.repository.interface";
import type { ISavedMentorRepository } from "../../../../src/domain/repositories/saved-mentor.repository.interface";
import { createMentorList } from "../../../factories/entities/mentor-list.factory";
import { createSavedMentor } from "../../../factories/entities/saved-mentor.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("mentor list use cases", () => {
	let mentorListRepository: ReturnType<
		typeof createMock<IMentorListRepository>
	>;
	let savedMentorRepository: ReturnType<
		typeof createMock<ISavedMentorRepository>
	>;
	let idGenerator: ReturnType<typeof createMock<IIdGenerator>>;

	beforeEach(() => {
		mentorListRepository = createMock<IMentorListRepository>();
		savedMentorRepository = createMock<ISavedMentorRepository>();
		idGenerator = createMock<IIdGenerator>();
		idGenerator.generate.mockReturnValue("generated-id");
	});

	it("creates a mentor list with title-cased name", async () => {
		const useCase = new CreateMentorListUseCase(
			mentorListRepository,
			idGenerator,
		);
		mentorListRepository.countByUserId.mockResolvedValue(0);
		mentorListRepository.create.mockImplementation(async (list) => list);

		const result = await useCase.execute({
			userId: "user-1",
			name: "frontend picks",
			description: "Saved mentors",
		});

		expect(mentorListRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "generated-id",
				name: "Frontend Picks",
			}),
		);
		expect(result.list.name).toBe("Frontend Picks");
	});

	it("blocks mentor list creation after the domain limit", async () => {
		const useCase = new CreateMentorListUseCase(
			mentorListRepository,
			idGenerator,
		);
		mentorListRepository.countByUserId.mockResolvedValue(20);

		await expect(
			useCase.execute({ userId: "user-1", name: "new list" }),
		).rejects.toBeInstanceOf(EntityValidationError);
	});

	it("adds a mentor to an existing list", async () => {
		const useCase = new AddMentorToListUseCase(
			mentorListRepository,
			savedMentorRepository,
			idGenerator,
		);
		mentorListRepository.findByIdAndUserId.mockResolvedValue(
			createMentorList(),
		);
		savedMentorRepository.findByUserMentorList.mockResolvedValue(null);
		savedMentorRepository.countByListId.mockResolvedValue(0);

		await useCase.execute({
			userId: "user-1",
			listId: "mentor-list-1",
			mentorId: "mentor-1",
		});

		expect(savedMentorRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "generated-id",
				mentorId: "mentor-1",
				listId: "mentor-list-1",
			}),
		);
	});

	it("fails to add a mentor when the list is missing or the mentor already exists", async () => {
		const useCase = new AddMentorToListUseCase(
			mentorListRepository,
			savedMentorRepository,
			idGenerator,
		);
		mentorListRepository.findByIdAndUserId.mockResolvedValue(null);
		savedMentorRepository.findByUserMentorList.mockResolvedValue(null);
		savedMentorRepository.countByListId.mockResolvedValue(0);

		await expect(
			useCase.execute({
				userId: "user-1",
				listId: "mentor-list-1",
				mentorId: "mentor-1",
			}),
		).rejects.toBeInstanceOf(MentorListNotFoundError);

		mentorListRepository.findByIdAndUserId.mockResolvedValue(
			createMentorList(),
		);
		savedMentorRepository.findByUserMentorList.mockResolvedValue(
			createSavedMentor(),
		);

		await expect(
			useCase.execute({
				userId: "user-1",
				listId: "mentor-list-1",
				mentorId: "mentor-1",
			}),
		).rejects.toBeInstanceOf(MentorAlreadySavedError);
	});

	it("returns a mentor list with its mentors", async () => {
		const useCase = new GetMentorListUseCase(
			mentorListRepository,
			savedMentorRepository,
		);
		mentorListRepository.findByIdAndUserId.mockResolvedValue(
			createMentorList(),
		);
		savedMentorRepository.findMentorsByListId.mockResolvedValue([
			{
				id: "mentor-1",
				userId: "user-2",
				user: { name: "Mentor One", profilePictureId: "avatar-1" },
				currentRoleDetails: { name: "Backend Engineer" },
				bio: "Experienced backend mentor",
				yearsOfExperience: 7,
				avgRating: 4.9,
				tierName: "Gold",
				languages: ["English"],
				areasOfExpertise: ["backend"],
				categories: [{ id: "cat-1", name: "Backend" }],
				skills: [{ id: "skill-1", name: "Node.js" }],
				createdAt: new Date(),
			} as never,
		]);

		const result = await useCase.execute({
			userId: "user-1",
			listId: "mentor-list-1",
		});

		expect(result.list.mentorCount).toBe(1);
		expect(result.list.mentors).toHaveLength(1);
	});

	it("throws when fetching or deleting a missing mentor list", async () => {
		const getUseCase = new GetMentorListUseCase(
			mentorListRepository,
			savedMentorRepository,
		);
		const deleteUseCase = new DeleteMentorListUseCase(
			mentorListRepository,
			savedMentorRepository,
		);
		mentorListRepository.findByIdAndUserId.mockResolvedValue(null);

		await expect(
			getUseCase.execute({ userId: "user-1", listId: "mentor-list-1" }),
		).rejects.toBeInstanceOf(MentorListNotFoundError);
		await expect(
			deleteUseCase.execute({ userId: "user-1", listId: "mentor-list-1" }),
		).rejects.toBeInstanceOf(MentorListNotFoundError);
	});

	it("deletes a mentor list and its saved mentors", async () => {
		const useCase = new DeleteMentorListUseCase(
			mentorListRepository,
			savedMentorRepository,
		);
		mentorListRepository.findByIdAndUserId.mockResolvedValue(
			createMentorList(),
		);

		await useCase.execute({ userId: "user-1", listId: "mentor-list-1" });

		expect(savedMentorRepository.deleteByListId).toHaveBeenCalledWith(
			"mentor-list-1",
		);
		expect(mentorListRepository.deleteByIdAndUserId).toHaveBeenCalledWith(
			"mentor-list-1",
			"user-1",
		);
	});

	it("returns all mentor lists with mentor counts", async () => {
		const useCase = new GetMentorListsUseCase(
			mentorListRepository,
			savedMentorRepository,
		);
		mentorListRepository.findAllByUserId.mockResolvedValue([
			createMentorList({ id: "list-1", name: "Favorites" }),
			createMentorList({ id: "list-2", name: "Backend" }),
		]);
		savedMentorRepository.countByListId.mockResolvedValueOnce(2);
		savedMentorRepository.countByListId.mockResolvedValueOnce(1);

		const result = await useCase.execute({ userId: "user-1" });

		expect(result.items).toEqual([
			expect.objectContaining({ id: "list-1", mentorCount: 2 }),
			expect.objectContaining({ id: "list-2", mentorCount: 1 }),
		]);
	});

	it("removes a mentor from a list and validates prerequisites", async () => {
		const useCase = new RemoveMentorFromListUseCase(
			mentorListRepository,
			savedMentorRepository,
		);
		mentorListRepository.findByIdAndUserId.mockResolvedValue(
			createMentorList(),
		);
		savedMentorRepository.findByUserMentorList.mockResolvedValue(
			createSavedMentor(),
		);

		await useCase.execute({
			userId: "user-1",
			listId: "mentor-list-1",
			mentorId: "mentor-1",
		});

		expect(savedMentorRepository.deleteByUserMentorList).toHaveBeenCalledWith(
			"user-1",
			"mentor-1",
			"mentor-list-1",
		);

		savedMentorRepository.findByUserMentorList.mockResolvedValue(null);
		await expect(
			useCase.execute({
				userId: "user-1",
				listId: "mentor-list-1",
				mentorId: "mentor-1",
			}),
		).rejects.toBeInstanceOf(MentorNotFoundError);
	});
});
