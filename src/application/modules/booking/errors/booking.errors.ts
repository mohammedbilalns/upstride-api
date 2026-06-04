import { HttpStatus } from "../../../../shared/constants";
import { ApplicationError } from "../../../shared/errors/app-error";
import { ConflictError } from "../../../shared/errors/conflict-error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";

export class BookingNotFoundError extends NotFoundError {
	constructor() {
		super("Booking not found");
	}
}

export class BookingAlreadyCancelledError extends ConflictError {
	constructor() {
		super("Booking is already cancelled");
	}
}

export class UnauthorizedBookingActionError extends ApplicationError {
	constructor() {
		super(
			"Unauthorized to perform this action on the booking",
			HttpStatus.FORBIDDEN,
		);
	}
}

export class InvalidDateError extends ValidationError {
	constructor(message: string = "Invalid date format provided") {
		super(message);
	}
}

export class SlotNotAvailableError extends ConflictError {
	constructor() {
		super("The selected slot is no longer available");
	}
}

export class AvailabilityNotFoundError extends NotFoundError {
	constructor() {
		super("Availability rule not found");
	}
}

export class UnauthorizedAvailabilityActionError extends ApplicationError {
	constructor(
		message: string = "Unauthorized to perform this action on the availability rule",
	) {
		super(message, HttpStatus.FORBIDDEN);
	}
}

export class SessionTooEarlyError extends ConflictError {
	constructor(
		message: string = "Session has not started yet. You can join 5 minutes before the start time.",
	) {
		super(message);
	}
}
