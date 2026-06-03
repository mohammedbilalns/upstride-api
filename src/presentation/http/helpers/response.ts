import type { Response } from "express";
import { HttpStatus } from "../../../shared/constants/http-status-codes";

interface SuccessResponse<T> {
	success: true;
	message?: string;
	data?: T;
}

/**
 * Sends a standardized JSON success response.
 * handles 204 No Content by omitting the body.
 */

export const sendSuccess = <T>(
	res: Response,
	statusCode: HttpStatus,
	options: { message?: string; data?: T } = {},
): Response => {
	const { message, data } = options;

	// Handle 204 No Content
	if (statusCode === HttpStatus.NO_CONTENT) {
		return res.status(statusCode).send();
	}

	// Construct the response body
	const responseBody: SuccessResponse<T> = {
		success: true,
		...(message && { message }),
		...(data !== undefined && { data }),
	};

	//Send response
	return res.status(statusCode).json(responseBody);
};
