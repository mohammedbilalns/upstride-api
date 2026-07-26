import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LogoutUseCase } from "../../../../../src/application/modules/authentication/use-cases/logout/logout.use-case";
import type { ISessionRepository } from "../../../../../src/domain/repositories";
import type { ITokenRevocationRepository } from "../../../../../src/domain/repositories/token-revocation.repository.interface";
import { createSession } from "../../../../factories/entities/session.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("LogoutUseCase", () => {
	let sessionRepository: ReturnType<typeof createMock<ISessionRepository>>;
	let tokenRevocationRepository: ReturnType<
		typeof createMock<ITokenRevocationRepository>
	>;
	let useCase: LogoutUseCase;

	beforeEach(() => {
		sessionRepository = createMock<ISessionRepository>();
		tokenRevocationRepository = createMock<ITokenRevocationRepository>();
		useCase = new LogoutUseCase(sessionRepository, tokenRevocationRepository);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should do nothing when the session does not exist", async () => {
		sessionRepository.findBySid.mockResolvedValue(null);

		await useCase.execute({ sessionId: "sid-1" });

		expect(sessionRepository.revoke).not.toHaveBeenCalled();
		expect(tokenRevocationRepository.revokeSession).not.toHaveBeenCalled();
	});

	it("should do nothing when the session is already revoked", async () => {
		sessionRepository.findBySid.mockResolvedValue(
			createSession({ revoked: true }),
		);

		await useCase.execute({ sessionId: "sid-1" });

		expect(sessionRepository.revoke).not.toHaveBeenCalled();
		expect(tokenRevocationRepository.revokeSession).not.toHaveBeenCalled();
	});

	it("should revoke the session and token revocation entry", async () => {
		vi.spyOn(Date, "now").mockReturnValue(
			new Date("2030-01-01T00:00:00.000Z").getTime(),
		);

		const session = createSession({
			sid: "sid-1",
			expiresAt: new Date("2030-01-01T01:00:00.000Z"),
		});
		sessionRepository.findBySid.mockResolvedValue(session);

		await useCase.execute({ sessionId: session.sid });

		expect(sessionRepository.revoke).toHaveBeenCalledWith(session.sid);
		expect(tokenRevocationRepository.revokeSession).toHaveBeenCalledWith(
			session.sid,
			3600,
		);
	});
});
