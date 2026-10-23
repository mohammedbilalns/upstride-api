import { inject, injectable } from "inversify";
import type {
	IAddInterestUseCase,
	IAddProfessionUseCase,
	IAddSkillUseCase,
	IDisableInterestUseCase,
	IDisableProfessionUseCase,
	IDisableSkillUseCase,
	IEnableInterestUseCase,
	IEnableProfessionUseCase,
	IEnableSkillUseCase,
	IFetchCatalogUseCase,
	IGetOnboardingCatalogUseCase,
	IGetProfessionsUseCase,
} from "../../../application/modules/catalog/use-cases";
import type { IUpdateInterestUseCase } from "../../../application/modules/catalog/use-cases/udpate-interest.use-case.interface";
import type { IUpdateProfessionUseCase } from "../../../application/modules/catalog/use-cases/update-profession.use-case.interface";
import type { IUpdateSkillUseCase } from "../../../application/modules/catalog/use-cases/update-skill.use-case.interface";
import { HttpStatus } from "../../../shared/constants";
import { TYPES } from "../../../shared/types/types";
import type { ValidatedRequest } from "../../../shared/types/validated-request.type";
import { CatalogResponseMessages } from "../constants";
import { asyncHandler, sendSuccess } from "../helpers";
import type {
	AddInterestBody,
	AddProfessionBody,
	AddSkillBody,
	UpdateCatalogParams,
	UpdateInterestBody,
	UpdateProfessionBody,
	UpdateSkillBody,
} from "../validators/catalog";

@injectable()
export class CatalogController {
	constructor(
		@inject(TYPES.UseCases.GetOnboardingCatalog)
		private readonly _getOnboardingCatalogUseCase: IGetOnboardingCatalogUseCase,
		@inject(TYPES.UseCases.GetProfessions)
		private readonly _getProfessionsUseCase: IGetProfessionsUseCase,
		@inject(TYPES.UseCases.FetchCatalog)
		private readonly _fetchCatalogUseCase: IFetchCatalogUseCase,
		@inject(TYPES.UseCases.AddInterest)
		private readonly _addInterestUseCase: IAddInterestUseCase,
		@inject(TYPES.UseCases.DisableInterest)
		private readonly _disableInterestUseCase: IDisableInterestUseCase,
		@inject(TYPES.UseCases.AddSkill)
		private readonly _addSkillUseCase: IAddSkillUseCase,
		@inject(TYPES.UseCases.DisableSkill)
		private readonly _disableSkillUseCase: IDisableSkillUseCase,
		@inject(TYPES.UseCases.AddProfession)
		private readonly _addProfessionUseCase: IAddProfessionUseCase,
		@inject(TYPES.UseCases.DisableProfession)
		private readonly _disableProfessionUseCase: IDisableProfessionUseCase,
		@inject(TYPES.UseCases.EnableInterest)
		private readonly _enableInterestUseCase: IEnableInterestUseCase,
		@inject(TYPES.UseCases.EnableSkill)
		private readonly _enableSkillUseCase: IEnableSkillUseCase,
		@inject(TYPES.UseCases.EnableProfession)
		private readonly _enableProfessionUseCase: IEnableProfessionUseCase,
		@inject(TYPES.UseCases.UpdateSkill)
		private readonly _updateSkillUseCase: IUpdateSkillUseCase,
		@inject(TYPES.UseCases.UpdateProfession)
		private readonly _updateProfessionUseCase: IUpdateProfessionUseCase,
		@inject(TYPES.UseCases.UpdateInterest)
		private readonly _updateInterestUseCase: IUpdateInterestUseCase,
	) {}

	fetchCatalog = asyncHandler(async (_req, res) => {
		const data = await this._fetchCatalogUseCase.execute();

		sendSuccess(res, HttpStatus.OK, {
			message: CatalogResponseMessages.CATALOG_FETCHED_SUCCESS,
			data,
		});
	});

	getOnboardingCatalog = asyncHandler(async (_req, res) => {
		const data = await this._getOnboardingCatalogUseCase.execute();

		sendSuccess(res, HttpStatus.OK, {
			message: CatalogResponseMessages.CATALOG_FETCHED_SUCCESS,
			data,
		});
	});

	getProfessions = asyncHandler(async (_req, res) => {
		const data = await this._getProfessionsUseCase.execute();

		sendSuccess(res, HttpStatus.OK, {
			message: CatalogResponseMessages.CATALOG_FETCHED_SUCCESS,
			data,
		});
	});

	addInterest = asyncHandler(async (req: ValidatedRequest, res) => {
		const data = await this._addInterestUseCase.execute(
			req.validated.body as AddInterestBody,
		);

		sendSuccess(res, HttpStatus.CREATED, {
			message: CatalogResponseMessages.INTEREST_ADDED_SUCCESS,
			data,
		});
	});

	disableInterest = asyncHandler(async (req: ValidatedRequest, res) => {
		const data = await this._disableInterestUseCase.execute({
			interestId: (req.validated.params as UpdateCatalogParams).id,
		});

		sendSuccess(res, HttpStatus.OK, {
			message: CatalogResponseMessages.INTEREST_DISABLED_SUCCESS,
			data,
		});
	});

	addSkill = asyncHandler(async (req: ValidatedRequest, res) => {
		const data = await this._addSkillUseCase.execute(
			req.validated.body as AddSkillBody,
		);

		sendSuccess(res, HttpStatus.CREATED, {
			message: CatalogResponseMessages.SKILL_ADDED_SUCCESS,
			data,
		});
	});

	disableSkill = asyncHandler(async (req: ValidatedRequest, res) => {
		const data = await this._disableSkillUseCase.execute({
			skillId: (req.validated.params as UpdateCatalogParams).id,
		});

		sendSuccess(res, HttpStatus.OK, {
			message: CatalogResponseMessages.SKILL_DISABLED_SUCCESS,
			data,
		});
	});

	addProfession = asyncHandler(async (req: ValidatedRequest, res) => {
		const data = await this._addProfessionUseCase.execute(
			req.validated.body as AddProfessionBody,
		);

		sendSuccess(res, HttpStatus.CREATED, {
			message: CatalogResponseMessages.PROFESSION_ADDED_SUCCESS,
			data,
		});
	});

	disableProfession = asyncHandler(async (req: ValidatedRequest, res) => {
		const data = await this._disableProfessionUseCase.execute({
			professionId: (req.validated.params as UpdateCatalogParams).id,
		});

		sendSuccess(res, HttpStatus.OK, {
			message: CatalogResponseMessages.PROFESSION_DISABLED_SUCCESS,
			data,
		});
	});

	enableInterest = asyncHandler(async (req: ValidatedRequest, res) => {
		const data = await this._enableInterestUseCase.execute({
			interestId: (req.validated.params as UpdateCatalogParams).id,
		});

		sendSuccess(res, HttpStatus.OK, {
			message: CatalogResponseMessages.INTEREST_ENABLED_SUCCESS,
			data,
		});
	});

	enableSkill = asyncHandler(async (req: ValidatedRequest, res) => {
		const data = await this._enableSkillUseCase.execute({
			skillId: (req.validated.params as UpdateCatalogParams).id,
		});

		sendSuccess(res, HttpStatus.OK, {
			message: CatalogResponseMessages.SKILL_ENABLED_SUCCESS,
			data,
		});
	});

	enableProfession = asyncHandler(async (req: ValidatedRequest, res) => {
		const data = await this._enableProfessionUseCase.execute({
			professionId: (req.validated.params as UpdateCatalogParams).id,
		});

		sendSuccess(res, HttpStatus.OK, {
			message: CatalogResponseMessages.PROFESSION_ENABLED_SUCCESS,
			data,
		});
	});

	updateInterest = asyncHandler(async (req: ValidatedRequest, res) => {
		await this._updateInterestUseCase.execute({
			interestId: (req.validated.params as UpdateCatalogParams).id,
			name: (req.validated.body as UpdateInterestBody).name,
		});

		sendSuccess(res, HttpStatus.OK, {
			message: CatalogResponseMessages.UPDATE_INTEREST_SUCCESS,
		});
	});

	updateSkill = asyncHandler(async (req: ValidatedRequest, res) => {
		await this._updateSkillUseCase.execute({
			skillId: (req.validated.params as UpdateCatalogParams).id,
			name: (req.validated.body as UpdateSkillBody).name,
		});

		sendSuccess(res, HttpStatus.OK, {
			message: CatalogResponseMessages.UPDATE_SKILL_SUCCESS,
		});
	});

	updateProfession = asyncHandler(async (req: ValidatedRequest, res) => {
		await this._updateProfessionUseCase.execute({
			professionId: (req.validated.params as UpdateCatalogParams).id,
			name: (req.validated.body as UpdateProfessionBody).name,
		});

		sendSuccess(res, HttpStatus.OK, {
			message: CatalogResponseMessages.UPDATE_PROFESSION_SUCCESS,
		});
	});
}
