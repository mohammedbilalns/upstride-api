import { ValidationError } from "../../../shared/errors/validation-error";

export class AdminOnlyReportActionError extends ValidationError {
	constructor(action: string) {
		super(`Only admins can ${action}`);
	}
}
