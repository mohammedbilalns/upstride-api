import { beforeEach, describe, expect, it } from "vitest";
import {
	MentorAlreadySavedError,
	MentorListNotFoundError,
} from "../../../../src/application/modules/mentor-lists/errors";
import { AddMentorToListUseCase } from "../../../../src/application/modules/mentor-lists/use-cases/add-mentor-to-list.use-case";
import type { IIdGenerator } from "../../../../src/application/services/id-generator.service.interface";
import type { IMentorListRepository } from "../../../../src/domain/repositories/mentor-list.repository.interface";
import type { ISavedMentorRepository } from "../../../../src/domain/repositories/saved-mentor.repository.interface";
import { createMentorList } from "../../../factories/entities/mentor-list.factory";
import { createSavedMentor } from "../../../factories/entities/saved-mentor.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("AddMentorToListUseCase", () => {
	let mentorListRepository: ReturnType<
		typeof createMock<IMentorListRepository>
	>;
	let savedMentorRepository: ReturnType<
		typeof createMock<ISavedMentorRepository>
	>;
	let idGenerator: ReturnType<typeof createMock<IIdGenerator>>;
	let useCase: AddMentorToListUseCase;

	beforeEach(() => {
		mentorListRepository = createMock<IMentorListRepository>();
		savedMentorRepository = createMock<ISavedMentorRepository>();
		idGenerator = createMock<IIdGenerator>();

		useCase = new AddMentorToListUseCase(
			mentorListRepository,
			savedMentorRepository,
			idGenerator,
		);

		idGenerator.generate.mockReturnValue("saved-1");
	});

	it("should throw MentorListNotFoundError when list does not exist for user", async () => {
		mentorListRepository.findByIdAndUserId.mockResolvedValue(null);
		savedMentorRepository.findByUserMentorList.mockResolvedValue(null);
		savedMentorRepository.countByListId.mockResolvedValue(0);

		await expect(
			useCase.execute({
				userId: "user-1",
				mentorId: "mentor-1",
				listId: "list-1",
			}),
		).rejects.toBeInstanceOf(MentorListNotFoundError);

		expect(savedMentorRepository.create).not.toHaveBeenCalled();
	});

	it("should throw MentorAlreadySavedError when mentor is already in the list", async () => {
		const mockList = createMentorList({ id: "list-1", userId: "user-1" });
		const mockSaved = createSavedMentor({
			id: "saved-1",
			userId: "user-1",
			mentorId: "mentor-1",
			listId: "list-1",
		});

		mentorListRepository.findByIdAndUserId.mockResolvedValue(mockList);
		savedMentorRepository.findByUserMentorList.mockResolvedValue(mockSaved);
		savedMentorRepository.countByListId.mockResolvedValue(1);

		await expect(
			useCase.execute({
				userId: "user-1",
				mentorId: "mentor-1",
				listId: "list-1",
			}),
		).rejects.toBeInstanceOf(MentorAlreadySavedError);

		expect(savedMentorRepository.create).not.toHaveBeenCalled();
	});

	it("should save mentor to list successfully", async () => {
		const mockList = createMentorList({ id: "list-1", userId: "user-1" });

		mentorListRepository.findByIdAndUserId.mockResolvedValue(mockList);
		savedMentorRepository.findByUserMentorList.mockResolvedValue(null);
		savedMentorRepository.countByListId.mockResolvedValue(0);

		await useCase.execute({
			userId: "user-1",
			mentorId: "mentor-1",
			listId: "list-1",
		});

		expect(savedMentorRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "saved-1",
				userId: "user-1",
				mentorId: "mentor-1",
				listId: "list-1",
			}),
		);
	});
});
