import { beforeEach, describe, expect, it } from "vitest";
import type { EventBus } from "../../../../src/application/events/event-bus.interface";
import { UserNotFoundError } from "../../../../src/application/modules/authentication/errors";
import { BlockUserUseCase } from "../../../../src/application/modules/user-management/use-cases/block-user.use-case";
import { REFRESH_TOKEN_EXPIRES_IN_SECONDS } from "../../../../src/application/services";
import type {
	IReportRepository,
	ISessionRepository,
	IUserRepository,
} from "../../../../src/domain/repositories";
import type { ITokenRevocationRepository } from "../../../../src/domain/repositories/token-revocation.repository.interface";
import { createSession } from "../../../factories/entities/session.factory";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("BlockUserUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let sessionRepository: ReturnType<typeof createMock<ISessionRepository>>;
	let tokenRevocationRepository: ReturnType<
		typeof createMock<ITokenRevocationRepository>
	>;
	let reportRepository: ReturnType<typeof createMock<IReportRepository>>;
	let eventBus: ReturnType<typeof createMock<EventBus>>;
	let useCase: BlockUserUseCase;

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		sessionRepository = createMock<ISessionRepository>();
		tokenRevocationRepository = createMock<ITokenRevocationRepository>();
		reportRepository = createMock<IReportRepository>();
		eventBus = createMock<EventBus>();

		useCase = new BlockUserUseCase(
			userRepository,
			sessionRepository,
			tokenRevocationRepository,
			reportRepository,
			eventBus,
		);
	});

	it("should throw when the user does not exist", async () => {
		userRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute({ userId: "user-1" })).rejects.toBeInstanceOf(
			UserNotFoundError,
		);

		expect(userRepository.updateById).not.toHaveBeenCalled();
		expect(eventBus.publish).not.toHaveBeenCalled();
	});

	it("should block the user, revoke active sessions, and publish an event", async () => {
		userRepository.findById.mockResolvedValue(createUser({ id: "user-1" }));
		sessionRepository.findAllByUserId.mockResolvedValue([
			createSession({ sid: "sid-1", revoked: false }),
			createSession({ sid: "sid-2", revoked: true }),
			createSession({ sid: "sid-3", revoked: false }),
		]);

		const result = await useCase.execute({ userId: "user-1" });

		expect(result).toEqual({ resourceId: "user-1" });
		expect(userRepository.updateById).toHaveBeenCalledWith("user-1", {
			isBlocked: true,
		});
		expect(sessionRepository.revokeMultiple).toHaveBeenCalledWith([
			"sid-1",
			"sid-3",
		]);
		expect(tokenRevocationRepository.revokeMultiple).toHaveBeenCalledWith([
			{
				sessionId: "sid-1",
				ttl: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
			},
			{
				sessionId: "sid-3",
				ttl: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
			},
		]);
		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				payload: { userId: "user-1", isBlocked: true },
			}),
		);
		expect(reportRepository.updateById).not.toHaveBeenCalled();
	});

	it("should skip revocation when there are no active sessions", async () => {
		userRepository.findById.mockResolvedValue(createUser({ id: "user-1" }));
		sessionRepository.findAllByUserId.mockResolvedValue([
			createSession({ sid: "sid-1", revoked: true }),
		]);

		await useCase.execute({ userId: "user-1" });

		expect(sessionRepository.revokeMultiple).not.toHaveBeenCalled();
		expect(tokenRevocationRepository.revokeMultiple).not.toHaveBeenCalled();
		expect(eventBus.publish).toHaveBeenCalledOnce();
	});

	it("should resolve the report when reportId is provided", async () => {
		userRepository.findById.mockResolvedValue(createUser({ id: "user-1" }));
		sessionRepository.findAllByUserId.mockResolvedValue([]);

		await useCase.execute({ userId: "user-1", reportId: "report-1" });

		expect(reportRepository.updateById).toHaveBeenCalledWith("report-1", {
			status: "RESOLVED",
			actionTaken: "blocked user",
		});
	});
});
