import type { Request } from "express";

export type AuthenticatedRequest = Request & {
	user: NonNullable<Request["user"]>;
	validated: NonNullable<Request["validated"]>;
};
