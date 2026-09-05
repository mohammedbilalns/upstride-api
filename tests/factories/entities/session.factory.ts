import { Session } from "../../../src/domain/entities/session.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createSession(overrides: Partial<Session> = {}): Session {
	const data = mergeDefaults<Session>(
		{
			id: "session-1",
			sid: "sid-1",
			userId: "user-1",
			refreshTokenHash: "hashed-refresh-token",
			expiresAt: new Date("2030-01-02T00:00:00.000Z"),
			ipAddress: "127.0.0.1",
			userAgent: "Vitest",
			deviceName: "Chrome",
			deviceType: "desktop",
			revoked: false,
			lastUsedAt: new Date(),
			createdAt: new Date(),
		},
		overrides,
	);

	return new Session(
		data.id,
		data.sid,
		data.userId,
		data.refreshTokenHash,
		data.expiresAt,
		data.ipAddress,
		data.userAgent,
		data.deviceName,
		data.deviceType,
		data.revoked,
		data.lastUsedAt,
		data.createdAt,
	);
}
