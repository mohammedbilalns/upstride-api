import { beforeEach, describe, expect, it } from "vitest";
import { GetActiveSessionsUseCase } from "../../../../../src/application/modules/authentication/use-cases/logout/get-active-sessions.use-case";
import type { ISessionRepository } from "../../../../../src/domain/repositories";
import { createSession } from "../../../../factories/entities/session.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("GetActiveSessionsUseCase", () => {
	let sessionRepository: ReturnType<typeof createMock<ISessionRepository>>;
	let useCase: GetActiveSessionsUseCase;

	beforeEach(() => {
		sessionRepository = createMock<ISessionRepository>();
		useCase = new GetActiveSessionsUseCase(sessionRepository);
	});

	it("should return active sessions sorted by last used at and exclude revoked and current session", async () => {
		const currentSession = createSession({
			sid: "sid-current",
			lastUsedAt: new Date("2030-01-03T00:00:00.000Z"),
		});
		const newestSession = createSession({
			sid: "sid-newest",
			lastUsedAt: new Date("2030-01-04T00:00:00.000Z"),
		});
		const olderSession = createSession({
			sid: "sid-older",
			lastUsedAt: new Date("2030-01-02T00:00:00.000Z"),
		});
		const revokedSession = createSession({
			sid: "sid-revoked",
			revoked: true,
			lastUsedAt: new Date("2030-01-05T00:00:00.000Z"),
		});

		sessionRepository.findAllByUserId.mockResolvedValue([
			currentSession,
			olderSession,
			revokedSession,
			newestSession,
		]);

		const result = await useCase.execute(
			{ userId: currentSession.userId },
			currentSession.sid,
		);

		expect(result).toEqual({
			sessions: [
				{
					id: newestSession.sid,
					ip: newestSession.ipAddress,
					deviceName: newestSession.deviceName,
					deviceType: newestSession.deviceType,
					lastUsedAt: newestSession.lastUsedAt,
					isCurrent: false,
				},
				{
					id: olderSession.sid,
					ip: olderSession.ipAddress,
					deviceName: olderSession.deviceName,
					deviceType: olderSession.deviceType,
					lastUsedAt: olderSession.lastUsedAt,
					isCurrent: false,
				},
			],
		});
		expect(sessionRepository.findAllByUserId).toHaveBeenCalledWith(
			currentSession.userId,
		);
	});

	it("should return an empty list when there are no active sessions", async () => {
		sessionRepository.findAllByUserId.mockResolvedValue([]);

		const result = await useCase.execute({ userId: "user-1" }, "sid-current");

		expect(result).toEqual({ sessions: [] });
	});
});
