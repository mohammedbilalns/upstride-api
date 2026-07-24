import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RevokeAllOtherSessionsUseCase } from "../../../../../src/application/modules/authentication/use-cases/logout/revoke-all-other-sessions.use-case";
import type { ISessionRepository } from "../../../../../src/domain/repositories";
import type { ITokenRevocationRepository } from "../../../../../src/domain/repositories/token-revocation.repository.interface";
import { createSession } from "../../../../factories/entities/session.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("RevokeAllOtherSessionsUseCase", () => {
	let sessionRepository: ReturnType<typeof createMock<ISessionRepository>>;
	let tokenRevocationRepository: ReturnType<
		typeof createMock<ITokenRevocationRepository>
	>;
	let useCase: RevokeAllOtherSessionsUseCase;

	beforeEach(() => {
		sessionRepository = createMock<ISessionRepository>();
		tokenRevocationRepository = createMock<ITokenRevocationRepository>();
		useCase = new RevokeAllOtherSessionsUseCase(
			sessionRepository,
			tokenRevocationRepository,
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should do nothing when there are no other active sessions", async () => {
		sessionRepository.findAllByUserId.mockResolvedValue([
			createSession({ sid: "sid-current", revoked: false }),
			createSession({ sid: "sid-revoked", revoked: true }),
		]);

		await useCase.execute({
			requesterUserId: "user-1",
			requesterSessionId: "sid-current",
		});

		expect(sessionRepository.revokeMultiple).not.toHaveBeenCalled();
		expect(tokenRevocationRepository.revokeMultiple).not.toHaveBeenCalled();
	});

	it("should revoke all other non-revoked sessions and create token revocations", async () => {
		vi.spyOn(Date, "now").mockReturnValue(
			new Date("2030-01-01T00:00:00.000Z").getTime(),
		);

		const currentSession = createSession({
			sid: "sid-current",
			lastUsedAt: new Date("2030-01-04T00:00:00.000Z"),
		});
		const activeFutureSession = createSession({
			sid: "sid-2",
			expiresAt: new Date("2030-01-01T00:10:00.000Z"),
			lastUsedAt: new Date("2030-01-03T00:00:00.000Z"),
		});
		const expiredSession = createSession({
			sid: "sid-3",
			expiresAt: new Date("2029-12-31T23:59:30.000Z"),
			lastUsedAt: new Date("2030-01-02T00:00:00.000Z"),
		});
		const revokedSession = createSession({
			sid: "sid-4",
			revoked: true,
			lastUsedAt: new Date("2030-01-05T00:00:00.000Z"),
		});

		sessionRepository.findAllByUserId.mockResolvedValue([
			currentSession,
			activeFutureSession,
			expiredSession,
			revokedSession,
		]);

		await useCase.execute({
			requesterUserId: "user-1",
			requesterSessionId: currentSession.sid,
		});

		expect(sessionRepository.revokeMultiple).toHaveBeenCalledWith([
			activeFutureSession.sid,
			expiredSession.sid,
		]);
		expect(tokenRevocationRepository.revokeMultiple).toHaveBeenCalledWith([
			{
				sessionId: activeFutureSession.sid,
				ttl: 600,
			},
			{
				sessionId: expiredSession.sid,
				ttl: 0,
			},
		]);
	});
});
