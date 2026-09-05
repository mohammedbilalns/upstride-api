import { beforeEach, describe, expect, it } from "vitest";
import { MentorNoShowService } from "../../../../../../src/application/modules/booking/services/mentor-no-show.service";
import type { ICreateNotificationUseCase } from "../../../../../../src/application/modules/notification/use-cases/create-notification.use-case.interface";
import type { IMentorWriteRepository } from "../../../../../../src/domain/repositories/mentor-write.repository.interface";
import type { ISessionRepository } from "../../../../../../src/domain/repositories/session.repository.interface";
import type { ITokenRevocationRepository } from "../../../../../../src/domain/repositories/token-revocation.repository.interface";
import type { IUserRepository } from "../../../../../../src/domain/repositories/user.repository.interface";
import { createMentor } from "../../../../../factories/entities/mentor.factory";
import { createSession } from "../../../../../factories/entities/session.factory";
import { createMock } from "../../../../../factories/utilities/create-mock";

describe("MentorNoShowService", () => {
	let mentorRepository: ReturnType<typeof createMock<IMentorWriteRepository>>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let sessionRepository: ReturnType<typeof createMock<ISessionRepository>>;
	let tokenRevocationRepository: ReturnType<
		typeof createMock<ITokenRevocationRepository>
	>;
	let createNotificationUseCase: ReturnType<
		typeof createMock<ICreateNotificationUseCase>
	>;
	let service: MentorNoShowService;

	beforeEach(() => {
		mentorRepository = createMock<IMentorWriteRepository>();
		userRepository = createMock<IUserRepository>();
		sessionRepository = createMock<ISessionRepository>();
		tokenRevocationRepository = createMock<ITokenRevocationRepository>();
		createNotificationUseCase = createMock<ICreateNotificationUseCase>();

		service = new MentorNoShowService(
			mentorRepository,
			userRepository,
			sessionRepository,
			tokenRevocationRepository,
			createNotificationUseCase,
		);
	});

	describe("recordNoShow", () => {
		it("should return 0 if mentor not found", async () => {
			mentorRepository.findByUserId.mockResolvedValue(null);

			const result = await service.recordNoShow("user-1");

			expect(result).toBe(0);
			expect(mentorRepository.updateById).not.toHaveBeenCalled();
		});

		it("should increment skipped sessions count and return new count", async () => {
			mentorRepository.findByUserId.mockResolvedValue(
				createMentor({
					id: "mentor-1",
					skippedSessionsCount: 2,
				}),
			);

			const result = await service.recordNoShow("user-1");

			expect(result).toBe(3);
			expect(mentorRepository.updateById).toHaveBeenCalledWith("mentor-1", {
				skippedSessionsCount: 3,
			});
		});
	});

	describe("blockMentor", () => {
		it("should update user and mentor blocked status", async () => {
			sessionRepository.findAllByUserId.mockResolvedValue([]);

			await service.blockMentor("user-1");

			expect(userRepository.updateById).toHaveBeenCalledWith("user-1", {
				isBlocked: true,
			});
			expect(
				mentorRepository.updateIsUserBlockedStatusByUserId,
			).toHaveBeenCalledWith("user-1", true);
		});

		it("should revoke all active sessions", async () => {
			sessionRepository.findAllByUserId.mockResolvedValue([
				createSession({ sid: "sid-1", revoked: false }),
				createSession({ sid: "sid-2", revoked: true }),
				createSession({ sid: "sid-3", revoked: false }),
			]);

			await service.blockMentor("user-1");

			expect(sessionRepository.revokeMultiple).toHaveBeenCalledWith([
				"sid-1",
				"sid-3",
			]);
			expect(tokenRevocationRepository.revokeMultiple).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ sessionId: "sid-1" }),
					expect.objectContaining({ sessionId: "sid-3" }),
				]),
			);
		});

		it("should send notification to mentor", async () => {
			sessionRepository.findAllByUserId.mockResolvedValue([]);

			await service.blockMentor("user-1");

			expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: "user-1",
					type: "SYSTEM",
					event: "MENTOR_BLOCKED",
				}),
			);
		});
	});
});
