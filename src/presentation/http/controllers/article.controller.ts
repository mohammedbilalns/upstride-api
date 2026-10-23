import type { Response } from "express";
import { inject, injectable } from "inversify";
import type {
	ICreateArticleCommentUseCase,
	ICreateArticleUseCase,
	IDeleteArticleCommentUseCase,
	IDeleteArticleUseCase,
	IGetArticleCommentsUseCase,
	IGetArticleFeedUseCase,
	IGetArticlesUseCase,
	IGetArticleTopTagsUseCase,
	IGetArticleUseCase,
	IReactToArticleCommentUseCase,
	IReactToArticleUseCase,
	ISubmitArticleAppealUseCase,
	IUpdateArticleCommentUseCase,
	IUpdateArticleUseCase,
} from "../../../application/modules/article/use-cases";
import { HttpStatus } from "../../../shared/constants";
import type { AuthenticatedRequest } from "../../../shared/types/authenticated-request.type";
import { TYPES } from "../../../shared/types/types";
import { ArticleResponseMessages } from "../constants";
import { asyncHandler, sendSuccess } from "../helpers";
import type {
	AppealArticleBody,
	ArticleIdParam,
	ArticlesQuery,
	CommentIdParam,
	CommentsQuery,
	CreateArticleBody,
	CreateCommentBody,
	GetArticleParam,
	MentorArticlesQuery,
	ReactBody,
	UpdateArticleBody,
	UpdateCommentBody,
} from "../validators/article.validator";

@injectable()
export class ArticleController {
	constructor(
		@inject(TYPES.UseCases.GetArticleFeed)
		private readonly _getArticleFeedUseCase: IGetArticleFeedUseCase,
		@inject(TYPES.UseCases.GetArticles)
		private readonly _getArticlesUseCase: IGetArticlesUseCase,
		@inject(TYPES.UseCases.GetArticle)
		private readonly _getArticleUseCase: IGetArticleUseCase,
		@inject(TYPES.UseCases.CreateArticle)
		private readonly _createArticleUseCase: ICreateArticleUseCase,
		@inject(TYPES.UseCases.UpdateArticle)
		private readonly _updateArticleUseCase: IUpdateArticleUseCase,
		@inject(TYPES.UseCases.DeleteArticle)
		private readonly _deleteArticleUseCase: IDeleteArticleUseCase,
		@inject(TYPES.UseCases.CreateArticleComment)
		private readonly _createArticleCommentUseCase: ICreateArticleCommentUseCase,
		@inject(TYPES.UseCases.UpdateArticleComment)
		private readonly _updateArticleCommentUseCase: IUpdateArticleCommentUseCase,
		@inject(TYPES.UseCases.DeleteArticleComment)
		private readonly _deleteArticleCommentUseCase: IDeleteArticleCommentUseCase,
		@inject(TYPES.UseCases.GetArticleComments)
		private readonly _getArticleCommentsUseCase: IGetArticleCommentsUseCase,
		@inject(TYPES.UseCases.ReactToArticle)
		private readonly _reactToArticleUseCase: IReactToArticleUseCase,
		@inject(TYPES.UseCases.ReactToArticleComment)
		private readonly _reactToArticleCommentUseCase: IReactToArticleCommentUseCase,
		@inject(TYPES.UseCases.GetArticleTopTags)
		private readonly _getTopTagsUseCase: IGetArticleTopTagsUseCase,
		@inject(TYPES.UseCases.SubmitArticleAppeal)
		private readonly _submitArticleAppealUseCase: ISubmitArticleAppealUseCase,
	) {}

	getTopTags = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			const data = await this._getTopTagsUseCase.execute(req.user?.id);
			return sendSuccess(res, HttpStatus.OK, { data });
		},
	);

	getArticles = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			const query = req.validated.query as ArticlesQuery;
			const isAdminView =
				req.user?.role === "ADMIN" || req.user?.role === "SUPER_ADMIN";

			const hasFilters = Boolean(query.search || query.interest || query.tag);

			const data = hasFilters
				? await this._getArticlesUseCase.execute({
						...query,
						viewerUserId: req.user?.id,
						isAdminView,
					})
				: await this._getArticleFeedUseCase.execute({
						page: query.page,
						limit: query.limit ?? 6,
						userId: req.user.id,
					});
			return sendSuccess(res, HttpStatus.OK, { data });
		},
	);

	getMentorArticles = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			const query = req.validated.query as MentorArticlesQuery;

			const isAdminView =
				req.user?.role === "ADMIN" || req.user?.role === "SUPER_ADMIN";

			const data = await this._getArticlesUseCase.execute({
				...query,
				authorId: req.user.id,
				isMentorView: true,
				isAdminView,
			});
			return sendSuccess(res, HttpStatus.OK, { data });
		},
	);

	getArticle = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			const isAdminView =
				req.user?.role === "ADMIN" || req.user?.role === "SUPER_ADMIN";
			const data = await this._getArticleUseCase.execute({
				...(req.validated.params as GetArticleParam),
				viewerUserId: req.user?.id,
				isAdminView,
			});
			return sendSuccess(res, HttpStatus.OK, { data });
		},
	);

	getArticleForEdit = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			const { articleId } = req.validated.params as ArticleIdParam;
			const result = await this._getArticlesUseCase.execute({
				page: 1,
				isMentorView: true,
				authorId: req.user.id,
				ids: [articleId],
			});
			const article = result.items[0];
			if (!article) {
				return sendSuccess(res, HttpStatus.NOT_FOUND, {
					message: ArticleResponseMessages.ARTICLE_NOT_FOUND,
				});
			}
			return sendSuccess(res, HttpStatus.OK, { data: { article } });
		},
	);

	createArticle = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			const data = await this._createArticleUseCase.execute({
				userId: req.user.id,
				...(req.validated.body as CreateArticleBody),
			});
			return sendSuccess(res, HttpStatus.CREATED, { data });
		},
	);

	updateArticle = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			const { articleId } = req.validated.params as ArticleIdParam;

			const data = await this._updateArticleUseCase.execute({
				userId: req.user.id,
				articleId,
				...(req.validated.body as UpdateArticleBody),
			});
			return sendSuccess(res, HttpStatus.OK, { data });
		},
	);

	deleteArticle = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			await this._deleteArticleUseCase.execute({
				userId: req.user.id,
				...(req.validated.params as ArticleIdParam),
			});
			return sendSuccess(res, HttpStatus.OK);
		},
	);

	createComment = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			const data = await this._createArticleCommentUseCase.execute({
				userId: req.user.id,
				...(req.validated.params as ArticleIdParam),
				...(req.validated.body as CreateCommentBody),
			});
			return sendSuccess(res, HttpStatus.CREATED, { data });
		},
	);

	updateComment = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			const data = await this._updateArticleCommentUseCase.execute({
				userId: req.user.id,
				...(req.validated.params as CommentIdParam),
				...(req.validated.body as UpdateCommentBody),
			});
			return sendSuccess(res, HttpStatus.OK, { data });
		},
	);

	deleteComment = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			await this._deleteArticleCommentUseCase.execute({
				userId: req.user.id,
				...(req.validated.params as CommentIdParam),
			});
			return sendSuccess(res, HttpStatus.OK);
		},
	);

	getComments = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			const data = await this._getArticleCommentsUseCase.execute({
				...(req.validated.params as ArticleIdParam),
				...(req.validated.query as CommentsQuery),
			});
			return sendSuccess(res, HttpStatus.OK, { data });
		},
	);

	reactToArticle = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			const data = await this._reactToArticleUseCase.execute({
				userId: req.user.id,
				...(req.validated.params as ArticleIdParam),
				...(req.validated.body as ReactBody),
			});
			return sendSuccess(res, HttpStatus.OK, { data });
		},
	);

	reactToComment = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			const data = await this._reactToArticleCommentUseCase.execute({
				userId: req.user.id,
				...(req.validated.body as ReactBody),
				...(req.validated.params as CommentIdParam),
			});
			return sendSuccess(res, HttpStatus.OK, { data });
		},
	);

	submitAppeal = asyncHandler(
		async (req: AuthenticatedRequest, res: Response) => {
			await this._submitArticleAppealUseCase.execute({
				userId: req.user.id,
				...(req.validated.params as ArticleIdParam),
				...(req.validated.body as AppealArticleBody),
			});

			return sendSuccess(res, HttpStatus.OK, {
				message: ArticleResponseMessages.APPEAL_SUBMITTED_SUCCESS,
			});
		},
	);
}
