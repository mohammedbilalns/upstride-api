import { inject, injectable } from "inversify";
import type {
	IAddMentorToListUseCase,
	ICreateMentorListUseCase,
	IDeleteMentorListUseCase,
	IGetMentorListsUseCase,
	IGetMentorListUseCase,
	IRemoveMentorFromListUseCase,
} from "../../../application/modules/mentor-lists/use-cases";
import { HttpStatus } from "../../../shared/constants";
import type { AuthenticatedRequest } from "../../../shared/types/authenticated-request.type";
import { TYPES } from "../../../shared/types/types";
import { asyncHandler, sendSuccess } from "../helpers";
import type {
	AddMentorToListBody,
	CreateMentorListBody,
	MentorListIdParam,
	RemoveMentorFromListParams,
} from "../validators/mentor-list.validator";

@injectable()
export class MentorListController {
	constructor(
		@inject(TYPES.UseCases.GetMentorLists)
		private readonly _getMentorListsUseCase: IGetMentorListsUseCase,
		@inject(TYPES.UseCases.GetMentorList)
		private readonly _getMentorListUseCase: IGetMentorListUseCase,
		@inject(TYPES.UseCases.CreateMentorList)
		private readonly _createMentorListUseCase: ICreateMentorListUseCase,
		@inject(TYPES.UseCases.AddMentorToList)
		private readonly _addMentorToListUseCase: IAddMentorToListUseCase,
		@inject(TYPES.UseCases.RemoveMentorFromList)
		private readonly _removeMentorFromListUseCase: IRemoveMentorFromListUseCase,
		@inject(TYPES.UseCases.DeleteMentorList)
		private readonly _deleteMentorListUseCase: IDeleteMentorListUseCase,
	) {}

	getLists = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const data = await this._getMentorListsUseCase.execute({
			userId: req.user.id,
		});

		sendSuccess(res, HttpStatus.OK, { data });
	});

	getList = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const data = await this._getMentorListUseCase.execute({
			userId: req.user.id,
			...(req.validated.params as MentorListIdParam),
		});

		sendSuccess(res, HttpStatus.OK, { data });
	});

	createList = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const data = await this._createMentorListUseCase.execute({
			userId: req.user.id,
			...(req.validated.body as CreateMentorListBody),
		});

		sendSuccess(res, HttpStatus.CREATED, { data });
	});

	addMentor = asyncHandler(async (req: AuthenticatedRequest, res) => {
		await this._addMentorToListUseCase.execute({
			userId: req.user.id,
			...(req.validated.params as MentorListIdParam),
			...(req.validated.body as AddMentorToListBody),
		});

		sendSuccess(res, HttpStatus.OK);
	});

	removeMentor = asyncHandler(async (req: AuthenticatedRequest, res) => {
		await this._removeMentorFromListUseCase.execute({
			userId: req.user.id,
			...(req.validated.params as RemoveMentorFromListParams),
		});

		sendSuccess(res, HttpStatus.OK);
	});

	deleteList = asyncHandler(async (req: AuthenticatedRequest, res) => {
		await this._deleteMentorListUseCase.execute({
			userId: req.user.id,
			...(req.validated.params as MentorListIdParam),
		});

		sendSuccess(res, HttpStatus.OK);
	});
}
