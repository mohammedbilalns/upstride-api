import { inject, injectable } from "inversify";
import type {
	IBlockUserUseCase,
	IGetUsersUseCase,
	IUnblockUserUseCase,
} from "../../../application/modules/user-management/use-cases";
import { HttpStatus } from "../../../shared/constants";
import type { ValidatedRequest } from "../../../shared/types/validated-request.type";
import { TYPES } from "../../../shared/types/types";
import { UsersResponseMessages } from "../constants";
import { asyncHandler, sendSuccess } from "../helpers";
import type {
	BlockUserBody,
	UserIdParam,
	UsersQuery,
} from "../validators/users.validator";

@injectable()
export class UsersManagementController {
	constructor(
		@inject(TYPES.UseCases.GetUsers)
		private _getUsersUseCase: IGetUsersUseCase,
		@inject(TYPES.UseCases.BlockUser)
		private _blockUserUseCase: IBlockUserUseCase,
		@inject(TYPES.UseCases.UnblockUser)
		private _unblockUserUseCase: IUnblockUserUseCase,
	) {}

	getUsers = asyncHandler(async (req: ValidatedRequest, res) => {
		const data = await this._getUsersUseCase.execute({
			...(req.validated.query as UsersQuery),
		});

		sendSuccess(res, HttpStatus.OK, {
			message: UsersResponseMessages.USERS_FETCHED_SUCCESS,
			data,
		});
	});

	blockUser = asyncHandler(async (req: ValidatedRequest, res) => {
		const data = await this._blockUserUseCase.execute({
			userId: (req.validated.params as UserIdParam).id,
			...(req.validated.body as BlockUserBody),
		});

		sendSuccess(res, HttpStatus.OK, {
			message: UsersResponseMessages.USER_BLOCKED_SUCCESS,
			data,
		});
	});

	unblockUser = asyncHandler(async (req: ValidatedRequest, res) => {
		const data = await this._unblockUserUseCase.execute({
			userId: (req.validated.params as UserIdParam).id,
		});

		sendSuccess(res, HttpStatus.OK, {
			message: UsersResponseMessages.USER_UNBLOCKED_SUCCESS,
			data,
		});
	});
}
