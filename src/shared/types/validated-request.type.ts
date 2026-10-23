import type { Request } from "express";

/** Request whose `validated` property is guaranteed to be set (by the validation middleware). */
export type ValidatedRequest = Request & {
	validated: NonNullable<Request["validated"]>;
};
