import { inject, injectable } from "inversify";
import type { IMentorWriteRepository } from "../../../../domain/repositories/mentor-write.repository.interface";
import type { ISessionRepository } from "../../../../domain/repositories/session.repository.interface";
import type { ITokenRevocationRepository } from "../../../../domain/repositories/token-revocation.repository.interface";
import type { IUserRepository } from "../../../../domain/repositories/user.repository.interface";
import { TYPES } from "../../../../shared/types/types";
import type { ICreateNotificationUseCase } from "../../../modules/notification/use-cases/create-notification.use-case.interface";
import { REFRESH_TOKEN_EXPIRES_IN_SECONDS } from "../../../services";

@injectable()
export class MentorNoShowService {
	constructor(
		@inject(TYPES.Repositories.MentorWriteRepository)
		private readonly _mentorRepository: IMentorWriteRepository,
		@inject(TYPES.Repositories.UserRepository)
		private readonly _userRepository: IUserRepository,
		@inject(TYPES.Repositories.SessionRepository)
		private readonly _sessionRepository: ISessionRepository,
		@inject(TYPES.Repositories.TokenRevocationRepository)
		private readonly _tokenRevocationRepository: ITokenRevocationRepository,
		@inject(TYPES.UseCases.CreateNotification)
		private readonly _createNotificationUseCase: ICreateNotificationUseCase,
	) {}

	async recordNoShow(mentorUserId: string): Promise<number> {
		const mentor = await this._mentorRepository.findByUserId(mentorUserId);
		if (!mentor) {
			return 0;
		}

		const nextSkippedSessions = mentor.skippedSessionsCount + 1;
		await this._mentorRepository.updateById(mentor.id, {
			skippedSessionsCount: nextSkippedSessions,
		});

		return nextSkippedSessions;
	}

	async blockMentor(mentorUserId: string): Promise<void> {
		await this._userRepository.updateById(mentorUserId, {
			isBlocked: true,
		});
		await this._mentorRepository.updateIsUserBlockedStatusByUserId(
			mentorUserId,
			true,
		);

		const sessions =
			await this._sessionRepository.findAllByUserId(mentorUserId);
		const activeSids = sessions
			.filter((session) => !session.revoked)
			.map((session) => session.sid);

		if (activeSids.length > 0) {
			await Promise.all([
				this._sessionRepository.revokeMultiple(activeSids),
				this._tokenRevocationRepository.revokeMultiple(
					activeSids.map((sid) => ({
						sessionId: sid,
						ttl: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
					})),
				),
			]);
		}

		await this._createNotificationUseCase.execute({
			userId: mentorUserId,
			title: "Mentor Account Blocked",
			description:
				"Your mentor account has been blocked after repeated missed sessions.",
			type: "SYSTEM",
			event: "MENTOR_BLOCKED",
			metadata: {
				userId: mentorUserId,
				reason: "Repeated missed sessions",
			},
		});
	}
}
