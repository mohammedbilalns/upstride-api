import { beforeEach, describe, expect, it } from "vitest";
import { CatalogLimitExceededError } from "../../../../src/application/modules/catalog/errors/catalog-limit-exceeded.error";
import { InterestConflictError } from "../../../../src/application/modules/catalog/errors/interest-conflict.error";
import { InterestNotFound } from "../../../../src/application/modules/catalog/errors/interest-not-found.error";
import { ProfessionConflictError } from "../../../../src/application/modules/catalog/errors/profession-conflict.error";
import { SkillConflictError } from "../../../../src/application/modules/catalog/errors/skill-conflict.error";
import { AddInterestUseCase } from "../../../../src/application/modules/catalog/use-cases/add-interest.use-case";
import { AddProfessionUseCase } from "../../../../src/application/modules/catalog/use-cases/add-profession.use-case";
import { AddSkillUseCase } from "../../../../src/application/modules/catalog/use-cases/add-skill.use-case";
import { DisableInterestUseCase } from "../../../../src/application/modules/catalog/use-cases/disable-interest.use-case";
import { DisableProfessionUseCase } from "../../../../src/application/modules/catalog/use-cases/disable-profession.use-case";
import { DisableSkillUseCase } from "../../../../src/application/modules/catalog/use-cases/disable-skill.use-case";
import { EnableInterestUseCase } from "../../../../src/application/modules/catalog/use-cases/enable-interest.use-case";
import { EnableProfessionUseCase } from "../../../../src/application/modules/catalog/use-cases/enable-profession.use-case";
import { EnableSkillUseCase } from "../../../../src/application/modules/catalog/use-cases/enable-skill.use-case";
import { FetchCatalogUseCase } from "../../../../src/application/modules/catalog/use-cases/fetch-catalog.use-case";
import { GetOnboardingCatalogUseCase } from "../../../../src/application/modules/catalog/use-cases/get-onboarding-catalog.use-case";
import { GetProfessionsUseCase } from "../../../../src/application/modules/catalog/use-cases/get-professions.use-case";
import { UpdateInterestUseCase } from "../../../../src/application/modules/catalog/use-cases/update-interest.use-case";
import { UpdateProfessionUseCase } from "../../../../src/application/modules/catalog/use-cases/update-profession.use-case";
import { UpdateSkillUseCase } from "../../../../src/application/modules/catalog/use-cases/update-skill.use-case";
import type {
	IInterestRepository,
	ISkillRepository,
} from "../../../../src/domain/repositories";
import type { IProfessionRepository } from "../../../../src/domain/repositories/profession.repository.interface";
import { CatalogLimits } from "../../../../src/shared/constants/app.constants";
import { createInterest } from "../../../factories/entities/interest.factory";
import { createProfession } from "../../../factories/entities/profession.factory";
import { createSkill } from "../../../factories/entities/skill.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("catalog use cases", () => {
	let interestRepository: ReturnType<typeof createMock<IInterestRepository>>;
	let professionRepository: ReturnType<
		typeof createMock<IProfessionRepository>
	>;
	let skillRepository: ReturnType<typeof createMock<ISkillRepository>>;

	beforeEach(() => {
		interestRepository = createMock<IInterestRepository>();
		professionRepository = createMock<IProfessionRepository>();
		skillRepository = createMock<ISkillRepository>();
	});

	it("adds an interest with a generated slug", async () => {
		const useCase = new AddInterestUseCase(interestRepository);
		interestRepository.query.mockResolvedValueOnce([]);
		interestRepository.query.mockResolvedValueOnce([]);
		interestRepository.query.mockResolvedValueOnce([]);
		interestRepository.create.mockResolvedValue(
			createInterest({
				id: "interest-2",
				name: "Data Science",
				slug: "data-science",
			}),
		);

		const result = await useCase.execute({ name: "data science" });

		expect(interestRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Data Science",
				slug: "data-science",
			}),
		);
		expect(result).toEqual({
			name: "Data Science",
			newInterestId: "interest-2",
			slug: "data-science",
		});
	});

	it("rejects duplicate or excessive interests", async () => {
		const useCase = new AddInterestUseCase(interestRepository);
		interestRepository.query.mockResolvedValue(
			Array.from({ length: CatalogLimits.MAX_TOTAL_INTERESTS }, (_, index) =>
				createInterest({ id: `interest-${index}` }),
			),
		);

		await expect(useCase.execute({ name: "backend" })).rejects.toBeInstanceOf(
			CatalogLimitExceededError,
		);

		interestRepository.query.mockResolvedValueOnce([]);
		interestRepository.query.mockResolvedValueOnce([createInterest()]);

		await expect(
			useCase.execute({ name: "backend development" }),
		).rejects.toBeInstanceOf(InterestConflictError);
	});

	it("adds a profession with a generated slug", async () => {
		const useCase = new AddProfessionUseCase(professionRepository);
		professionRepository.query.mockResolvedValueOnce([]);
		professionRepository.query.mockResolvedValueOnce([]);
		professionRepository.query.mockResolvedValueOnce([]);
		professionRepository.create.mockResolvedValue(
			createProfession({
				id: "profession-2",
				name: "Product Designer",
				slug: "product-designer",
			}),
		);

		const result = await useCase.execute({ name: "product designer" });

		expect(result).toEqual({
			name: "Product Designer",
			newProfessionId: "profession-2",
			slug: "product-designer",
		});
	});

	it("rejects duplicate or excessive professions", async () => {
		const useCase = new AddProfessionUseCase(professionRepository);
		professionRepository.query.mockResolvedValueOnce([createProfession()]);

		await expect(
			useCase.execute({ name: "software engineer" }),
		).rejects.toBeInstanceOf(ProfessionConflictError);

		professionRepository.query.mockResolvedValueOnce([]);
		professionRepository.query.mockResolvedValueOnce(
			Array.from({ length: CatalogLimits.MAX_TOTAL_PROFESSIONS }, (_, index) =>
				createProfession({ id: `profession-${index}` }),
			),
		);

		await expect(
			useCase.execute({ name: "qa engineer" }),
		).rejects.toBeInstanceOf(CatalogLimitExceededError);
	});

	it("adds a skill inside an existing interest", async () => {
		const useCase = new AddSkillUseCase(skillRepository, interestRepository);
		interestRepository.findById.mockResolvedValue(createInterest());
		skillRepository.countByInterestId.mockResolvedValue(0);
		skillRepository.query.mockResolvedValueOnce([]);
		skillRepository.query.mockResolvedValueOnce([]);
		skillRepository.create.mockResolvedValue(
			createSkill({
				id: "skill-2",
				name: "GraphQL",
				slug: "graphql",
				interestId: "interest-1",
			}),
		);

		const result = await useCase.execute({
			name: "graphql",
			interestId: "interest-1",
		});

		expect(result).toEqual({
			name: "Graphql",
			newSkillId: "skill-2",
			interestId: "interest-1",
			slug: "graphql",
		});
	});

	it("rejects missing, duplicate, or excessive skills", async () => {
		const useCase = new AddSkillUseCase(skillRepository, interestRepository);
		interestRepository.findById.mockResolvedValue(null);

		await expect(
			useCase.execute({ name: "graphql", interestId: "interest-1" }),
		).rejects.toBeInstanceOf(InterestNotFound);

		interestRepository.findById.mockResolvedValue(createInterest());
		skillRepository.countByInterestId.mockResolvedValue(
			CatalogLimits.MAX_SKILLS_PER_INTEREST,
		);
		skillRepository.query.mockResolvedValue([]);

		await expect(
			useCase.execute({ name: "graphql", interestId: "interest-1" }),
		).rejects.toBeInstanceOf(CatalogLimitExceededError);

		skillRepository.countByInterestId.mockResolvedValue(0);
		skillRepository.query.mockResolvedValueOnce([createSkill()]);

		await expect(
			useCase.execute({ name: "graphql", interestId: "interest-1" }),
		).rejects.toBeInstanceOf(SkillConflictError);
	});

	it("enables and disables catalog resources", async () => {
		const disableInterest = new DisableInterestUseCase(interestRepository);
		const enableInterest = new EnableInterestUseCase(interestRepository);
		const disableProfession = new DisableProfessionUseCase(
			professionRepository,
		);
		const enableProfession = new EnableProfessionUseCase(professionRepository);
		const disableSkill = new DisableSkillUseCase(skillRepository);
		const enableSkill = new EnableSkillUseCase(skillRepository);

		await expect(
			disableInterest.execute({ interestId: "interest-1" }),
		).resolves.toEqual({
			resourceId: "interest-1",
		});
		await expect(
			enableInterest.execute({ interestId: "interest-1" }),
		).resolves.toEqual({
			resourceId: "interest-1",
		});
		await expect(
			disableProfession.execute({ professionId: "profession-1" }),
		).resolves.toEqual({ resourceId: "profession-1" });
		await expect(
			enableProfession.execute({ professionId: "profession-1" }),
		).resolves.toEqual({ resourceId: "profession-1" });
		await expect(disableSkill.execute({ skillId: "skill-1" })).resolves.toEqual(
			{
				resourceId: "skill-1",
			},
		);
		await expect(enableSkill.execute({ skillId: "skill-1" })).resolves.toEqual({
			resourceId: "skill-1",
		});
	});

	it("fetches the full catalog", async () => {
		const useCase = new FetchCatalogUseCase(
			professionRepository,
			interestRepository,
			skillRepository,
		);
		professionRepository.query.mockResolvedValue([createProfession()]);
		interestRepository.query.mockResolvedValue([createInterest()]);
		skillRepository.query.mockResolvedValue([createSkill()]);

		const result = await useCase.execute();

		expect(result.professions).toHaveLength(1);
		expect(result.interests[0].skills).toHaveLength(1);
	});

	it("fetches onboarding catalog and professions", async () => {
		const onboardingUseCase = new GetOnboardingCatalogUseCase(
			interestRepository,
			skillRepository,
		);
		const professionsUseCase = new GetProfessionsUseCase(professionRepository);
		interestRepository.query.mockResolvedValue([createInterest()]);
		skillRepository.query.mockResolvedValue([createSkill()]);
		professionRepository.findAllActive.mockResolvedValue([createProfession()]);

		const onboarding = await onboardingUseCase.execute();
		const professions = await professionsUseCase.execute();

		expect(onboarding.interests[0].skills[0].slug).toBe("typescript");
		expect(professions[0]).toEqual(
			expect.objectContaining({
				id: "profession-1",
				slug: "software-engineer",
			}),
		);
	});

	it("updates interest, profession, and skill names using title case", async () => {
		const updateInterest = new UpdateInterestUseCase(interestRepository);
		const updateProfession = new UpdateProfessionUseCase(professionRepository);
		const updateSkill = new UpdateSkillUseCase(skillRepository);

		await expect(
			updateInterest.execute({
				interestId: "interest-1",
				name: "machine learning",
			}),
		).resolves.toEqual({ updatedName: "Machine Learning" });
		await expect(
			updateProfession.execute({
				professionId: "profession-1",
				name: "product manager",
			}),
		).resolves.toEqual({ updatedName: "Product Manager" });
		await expect(
			updateSkill.execute({ skillId: "skill-1", name: "system design" }),
		).resolves.toEqual({ updatedName: "System Design" });

		expect(interestRepository.updateById).toHaveBeenCalledWith("interest-1", {
			name: "Machine Learning",
		});
		expect(professionRepository.updateById).toHaveBeenCalledWith(
			"profession-1",
			{ name: "Product Manager" },
		);
		expect(skillRepository.updateById).toHaveBeenCalledWith("skill-1", {
			name: "System Design",
		});
	});
});
