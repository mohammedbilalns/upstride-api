import { inject, injectable } from "inversify";
import type {
	DeleteFileUseCase,
	GetPreSignedUploadUrlUseCase,
} from "../../../application/modules/storage/use-cases";
import { HttpStatus } from "../../../shared/constants";
import { TYPES } from "../../../shared/types/types";
import type { ValidatedRequest } from "../../../shared/types/validated-request.type";
import { FileResponseMessages } from "../constants";
import { asyncHandler, sendSuccess } from "../helpers";
import type {
	DeleteFileBodyPayload,
	GetPreSignedUploadUrlBody,
} from "../validators/file.validator";

@injectable()
export class FileController {
	constructor(
		@inject(TYPES.UseCases.GetPreSignedUploadUrl)
		private readonly _getPreSignedUploadUrlUseCase: GetPreSignedUploadUrlUseCase,
		@inject(TYPES.UseCases.DeleteFile)
		private readonly _deleteFileUseCase: DeleteFileUseCase,
	) {}

	getPreSignedUploadUrl = asyncHandler(async (req: ValidatedRequest, res) => {
		const result = await this._getPreSignedUploadUrlUseCase.execute(
			req.validated.body as GetPreSignedUploadUrlBody,
		);

		return sendSuccess(res, HttpStatus.OK, {
			message: FileResponseMessages.PRESIGNED_URL_GENERATED,
			data: result,
		});
	});

	deleteFile = asyncHandler(async (req: ValidatedRequest, res) => {
		await this._deleteFileUseCase.execute(
			(req.validated.body as DeleteFileBodyPayload).key,
		);

		return sendSuccess(res, HttpStatus.OK, {
			message: FileResponseMessages.DELETED,
		});
	});
}
