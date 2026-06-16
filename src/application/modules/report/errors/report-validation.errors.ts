import { ValidationError } from "../../../shared/errors/validation-error";

export class ReportAlreadyExistsError extends ValidationError {
	constructor(target: "article" | "user") {
		super(
			target === "article"
				? "You have already reported this article"
				: "You have already reported this user",
		);
	}
}
