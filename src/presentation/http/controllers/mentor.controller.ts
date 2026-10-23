import { inject, injectable } from "inversify";
import type {
	IGetMentorFeedUseCase,
	IGetMentorsUseCase,
} from "../../../application/modules/mentor-discovery/use-cases";
import type {
	IApproveMentorUseCase,
	IGetMentorApplicationsUseCase,
	IGetMentorProfileUseCase,
	IGetMentorRegistrationInfoUseCase,
	IGetPublicMentorProfileUseCase,
	IRegisterMentorUseCase,
	IRejectMentorUseCase,
	IResubmitMentorUseCase,
	IUpdateMentorProfileUseCase,
} from "../../../application/modules/mentor-moderation/use-cases";
import type {
	MentorApplicationsQuery,
	MentorDiscoveryQuery,
	MentorIdParam,
	RejectMentorBody,
	UpdateMentorProfileBody,
} from "../../../presentation/http/validators/mentor.validator";
import { HttpStatus } from "../../../shared/constants";
import type { AuthenticatedRequest } from "../../../shared/types/authenticated-request.type";
import { TYPES } from "../../../shared/types/types";
import type { ValidatedRequest } from "../../../shared/types/validated-request.type";
import { MentorResponseMessages } from "../constants";
import { asyncHandler, sendSuccess } from "../helpers";

@injectable()
export class MentorController {
	constructor(
		@inject(TYPES.UseCases.GetMentorRegistrationInfo)
		private readonly _getMentorRegistrationInfoUseCase: IGetMentorRegistrationInfoUseCase,
		@inject(TYPES.UseCases.GetMentorProfile)
		private readonly _getMentorProfileUseCase: IGetMentorProfileUseCase,
		@inject(TYPES.UseCases.GetPublicMentorProfile)
		private readonly _getPublicMentorProfileUseCase: IGetPublicMentorProfileUseCase,
		@inject(TYPES.UseCases.UpdateMentorProfile)
		private readonly _updateMentorProfileUseCase: IUpdateMentorProfileUseCase,
		@inject(TYPES.UseCases.RegisterMentor)
		private readonly _registerMentorUseCase: IRegisterMentorUseCase,
		@inject(TYPES.UseCases.ResubmitMentor)
		private readonly _resubmitMentorUseCase: IResubmitMentorUseCase,
		@inject(TYPES.UseCases.GetMentorApplications)
		private readonly _getMentorApplicationsUseCase: IGetMentorApplicationsUseCase,
		@inject(TYPES.UseCases.GetMentorsDiscovery)
		private readonly _getMentorsDiscoveryUseCase: IGetMentorsUseCase,
		@inject(TYPES.UseCases.GetMentorFeed)
		private readonly _getMentorFeedUseCase: IGetMentorFeedUseCase,
		@inject(TYPES.UseCases.ApproveMentor)
		private readonly _approveMentorUseCase: IApproveMentorUseCase,
		@inject(TYPES.UseCases.RejectMentor)
		private readonly _rejectMentorUseCase: IRejectMentorUseCase,
	) {}

	getApplications = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const query = req.validated.query as MentorApplicationsQuery;

		const result = await this._getMentorApplicationsUseCase.execute(query);

		return sendSuccess(res, HttpStatus.OK, {
			message: MentorResponseMessages.FETCH_APPLICATIONS_SUCCESS,
			data: result,
		});
	});

	getDiscovery = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const query = req.validated.query as MentorDiscoveryQuery;
		const isAdminView =
			req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN";

		const hasFilters = Boolean(
			query.search ||
				query.category ||
				(query.languages && query.languages.length > 0) ||
				query.tierName ||
				query.minExperience !== undefined ||
				query.maxExperience !== undefined ||
				query.sort,
		);

		const result = hasFilters
			? await this._getMentorsDiscoveryUseCase.execute({
					limit: 12,
					...query,
					excludeUserId: req.user.id,
					isAdminView,
				})
			: await this._getMentorFeedUseCase.execute({
					page: query.page,
					limit: 12,
					userId: req.user.id,
				});

		return sendSuccess(res, HttpStatus.OK, {
			message: MentorResponseMessages.FETCH_DISCOVERY_SUCCESS,
			data: result,
		});
	});

	approveApplication = asyncHandler(async (req: ValidatedRequest, res) => {
		await this._approveMentorUseCase.execute({
			mentorId: (req.validated.params as MentorIdParam).id,
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: MentorResponseMessages.APPROVE_APPLICATION_SUCCESS,
		});
	});

	rejectApplication = asyncHandler(async (req: ValidatedRequest, res) => {
		await this._rejectMentorUseCase.execute({
			mentorId: (req.validated.params as MentorIdParam).id,
			...(req.validated.body as RejectMentorBody),
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: MentorResponseMessages.REJECT_APPLICATION_SUCCESS,
		});
	});

	getRegistrationInfo = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._getMentorRegistrationInfoUseCase.execute({
			userId: req.user.id,
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: MentorResponseMessages.FETCH_REGISTRATION_INFO_SUCCESS,
			data: result,
		});
	});

	getProfile = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const data = await this._getMentorProfileUseCase.execute({
			userId: req.user.id,
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: MentorResponseMessages.PROFILE_FETCHED_SUCCESS,
			data,
		});
	});

	getPublicProfile = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const { id: userId, role } = req.user;

		const data = await this._getPublicMentorProfileUseCase.execute({
			mentorId: (req.validated.params as MentorIdParam).id,
			requesterUserId: userId,
			requesterRole: role,
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: MentorResponseMessages.PUBLIC_PROFILE_FETCHED_SUCCESS,
			data,
		});
	});

	updateProfile = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const data = await this._updateMentorProfileUseCase.execute({
			userId: req.user.id,
			...(req.validated.body as UpdateMentorProfileBody),
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: MentorResponseMessages.PROFILE_UPDATED_SUCCESS,
			data,
		});
	});

	register = asyncHandler(async (req: AuthenticatedRequest, res) => {
		await this._registerMentorUseCase.execute({
			...req.body,
			userId: req.user.id,
		});

		return sendSuccess(res, HttpStatus.CREATED, {
			message: MentorResponseMessages.REGISTRATION_SUBMITTED_SUCCESS,
		});
	});

	resubmit = asyncHandler(async (req: AuthenticatedRequest, res) => {
		await this._resubmitMentorUseCase.execute({
			...req.body,
			userId: req.user.id,
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: MentorResponseMessages.REGISTRATION_RESUBMITTED_SUCCESS,
		});
	});
}
