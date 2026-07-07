import { Report } from "../../../src/domain/entities/report.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createReport(overrides: Partial<Report> = {}): Report {
	const data = mergeDefaults<Report>(
		{
			id: "report-1",
			reporterId: "user-1",
			targetId: "article-1",
			targetType: "ARTICLE",
			reason: "Spam",
			description: "Contains spam content",
			status: "PENDING",
			actionTaken: "",
			createdAt: new Date(),
			updatedAt: new Date(),
			actionTakenAt: null,
			reporter: undefined,
			target: undefined,
			appealMessage: null,
			appealedAt: null,
			isAppealSubmitted: false,
		},
		overrides,
	);

	return new Report(
		data.id,
		data.reporterId,
		data.targetId,
		data.targetType,
		data.reason,
		data.description,
		data.status,
		data.actionTaken,
		data.createdAt,
		data.updatedAt,
		data.actionTakenAt,
		data.reporter,
		data.target,
		data.appealMessage,
		data.appealedAt,
		data.isAppealSubmitted,
	);
}
