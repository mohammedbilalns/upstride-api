import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "../../../../../src/application/modules/authentication/errors";
import { RevokeSessionUseCase } from "../../../../../src/application/modules/authentication/use-cases/logout/revoke-session.use-case";
import { ValidationError } from "../../../../../src/application/shared/errors/validation-error";
import type { ISessionRepository } from "../../../../../src/domain/repositories";
import type { ITokenRevocationRepository } from "../../../../../src/domain/repositories/token-revocation.repository.interface";
import { createSession } from "../../../../factories/entities/session.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("RevokeSessionUseCase", () => {
	let sessionRepository: ReturnType<typeof createMock<ISessionRepository>>;
	let tokenRevocationRepository: ReturnType<
		typeof createMock<ITokenRevocationRepository>
	>;
	let useCase: RevokeSessionUseCase;

	beforeEach(() => {
		sessionRepository = createMock<ISessionRepository>();
		tokenRevocationRepository = createMock<ITokenRevocationRepository>();
		useCase = new RevokeSessionUseCase(
			sessionRepository,
			tokenRevocationRepository,
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should throw ValidationError when target session does not exist", async () => {
		sessionRepository.findBySid.mockResolvedValue(null);

		await expect(
			useCase.execute({
				requesterUserId: "user-1",
				targetSessionId: "sid-1",
			}),
		).rejects.toBeInstanceOf(ValidationError);

		expect(sessionRepository.revoke).not.toHaveBeenCalled();
		expect(tokenRevocationRepository.revokeSession).not.toHaveBeenCalled();
	});

	it("should throw UnauthorizedError when the requester does not own the session", async () => {
		sessionRepository.findBySid.mockResolvedValue(
			createSession({ userId: "user-2" }),
		);

		await expect(
			useCase.execute({
				requesterUserId: "user-1",
				targetSessionId: "sid-1",
			}),
		).rejects.toBeInstanceOf(UnauthorizedError);

		expect(sessionRepository.revoke).not.toHaveBeenCalled();
		expect(tokenRevocationRepository.revokeSession).not.toHaveBeenCalled();
	});

	it("should revoke the target session and add a revocation entry", async () => {
		vi.spyOn(Date, "now").mockReturnValue(
			new Date("2030-01-01T00:00:00.000Z").getTime(),
		);

		const session = createSession({
			sid: "sid-1",
			userId: "user-1",
			expiresAt: new Date("2030-01-01T01:00:00.000Z"),
		});
		sessionRepository.findBySid.mockResolvedValue(session);

		await useCase.execute({
			requesterUserId: "user-1",
			targetSessionId: session.sid,
		});

		expect(sessionRepository.revoke).toHaveBeenCalledWith(session.sid);
		expect(tokenRevocationRepository.revokeSession).toHaveBeenCalledWith(
			session.sid,
			3600000,
		);
	});
});
