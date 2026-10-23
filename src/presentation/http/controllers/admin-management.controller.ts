import { inject, injectable } from "inversify";
import type {
	IBlockAdminUseCase,
	ICreateAdminUseCase,
	IGetAdminsUseCase,
	IUnblockAdminUseCase,
} from "../../../application/modules/admin-management/use-cases";
import { HttpStatus } from "../../../shared/constants";
import type { ValidatedRequest } from "../../../shared/types/validated-request.type";
import { TYPES } from "../../../shared/types/types";
import { AdminsResponseMessages } from "../constants";
import { asyncHandler, sendSuccess } from "../helpers";
import type {
	AdminIdParam,
	AdminsQuery,
	CreateAdminBody,
} from "../validators/admins.validator";

@injectable()
export class AdminManagementController {
	constructor(
		@inject(TYPES.UseCases.GetAdmins)
		private _getAdminsUseCase: IGetAdminsUseCase,
		@inject(TYPES.UseCases.CreateAdmin)
		private _createAdminUseCase: ICreateAdminUseCase,
		@inject(TYPES.UseCases.BlockAdmin)
		private _blockAdminUseCase: IBlockAdminUseCase,
		@inject(TYPES.UseCases.UnblockAdmin)
		private _unblockAdminUseCase: IUnblockAdminUseCase,
	) {}

	getAdmins = asyncHandler(async (req: ValidatedRequest, res) => {
		const data = await this._getAdminsUseCase.execute({
			...(req.validated.query as AdminsQuery),
		});

		sendSuccess(res, HttpStatus.OK, {
			message: AdminsResponseMessages.ADMINS_FETCHED_SUCCESS,
			data,
		});
	});

	createAdmin = asyncHandler(async (req: ValidatedRequest, res) => {
		const result = await this._createAdminUseCase.execute({
			...(req.validated.body as CreateAdminBody),
		});

		sendSuccess(res, HttpStatus.CREATED, {
			message: AdminsResponseMessages.ADMIN_CREATED_SUCCESS,
			data: result,
		});
	});

	blockAdmin = asyncHandler(async (req: ValidatedRequest, res) => {
		await this._blockAdminUseCase.execute({
			adminId: (req.validated.params as AdminIdParam).id,
		});

		sendSuccess(res, HttpStatus.OK, {
			message: AdminsResponseMessages.ADMIN_BLOCKED_SUCCESS,
		});
	});

	unblockAdmin = asyncHandler(async (req: ValidatedRequest, res) => {
		await this._unblockAdminUseCase.execute({
			adminId: (req.validated.params as AdminIdParam).id,
		});

		sendSuccess(res, HttpStatus.OK, {
			message: AdminsResponseMessages.ADMIN_UNBLOCKED_SUCCESS,
		});
	});
}
