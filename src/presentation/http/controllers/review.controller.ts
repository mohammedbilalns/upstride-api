import { inject, injectable } from "inversify";
import type { ICreateReviewUseCase } from "../../../application/modules/review/use-cases/create-review.use-case.interface";
import type { IGetMentorReviewsUseCase } from "../../../application/modules/review/use-cases/get-mentor-reviews.use-case.interface";
import { HttpStatus } from "../../../shared/constants/http-status-codes";
import type { AuthenticatedRequest } from "../../../shared/types/authenticated-request.type";
import { TYPES } from "../../../shared/types/types";
import { ReviewResponseMessages } from "../constants";
import { asyncHandler, sendSuccess } from "../helpers";
import type {
	CreateReviewBody,
	MentorReviewsQuery,
	ReviewBookingParam,
	ReviewMentorParam,
} from "../validators/review.validator";

@injectable()
export class ReviewController {
	constructor(
		@inject(TYPES.UseCases.CreateReview)
		private readonly _createReviewUseCase: ICreateReviewUseCase,
		@inject(TYPES.UseCases.GetMentorReviews)
		private readonly _getMentorReviewsUseCase: IGetMentorReviewsUseCase,
	) {}

	createReview = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._createReviewUseCase.execute({
			userId: req.user.id,
			bookingId: (req.validated.params as ReviewBookingParam).bookingId,
			...(req.validated.body as CreateReviewBody),
		});

		return sendSuccess(res, HttpStatus.CREATED, {
			message: ReviewResponseMessages.SUBMITTED_SUCCESS,
			data: result,
		});
	});

	getMentorReviews = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._getMentorReviewsUseCase.execute({
			mentorId: (req.validated.params as ReviewMentorParam).mentorId,
			...(req.validated.query as MentorReviewsQuery),
		});

		return sendSuccess(res, HttpStatus.OK, {
			data: result,
		});
	});
}
