import { describe, expect, it } from "vitest";
import { Session } from "../../../../src/domain/entities/session.entity";

describe("Session Entity", () => {
	describe("constructor", () => {
		it("should create a valid session", () => {
			const now = new Date();
			const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

			const session = new Session(
				"session-1",
				"sid-123",
				"user-1",
				"token-hash",
				expiresAt,
				"192.168.1.1",
				"Mozilla/5.0",
				"Chrome on Windows",
				"desktop",
				false,
				now,
				now,
			);

			expect(session.id).toBe("session-1");
			expect(session.userId).toBe("user-1");
			expect(session.revoked).toBe(false);
			expect(session.deviceType).toBe("desktop");
		});

		it("should store all session properties", () => {
			const now = new Date();
			const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

			const session = new Session(
				"session-2",
				"sid-456",
				"user-2",
				"hash-value",
				expiresAt,
				"10.0.0.1",
				"Safari/537.36",
				"Safari on macOS",
				"desktop",
				true,
				now,
				now,
			);

			expect(session.sid).toBe("sid-456");
			expect(session.refreshTokenHash).toBe("hash-value");
			expect(session.ipAddress).toBe("10.0.0.1");
			expect(session.revoked).toBe(true);
		});

		it("should allow mobile device type", () => {
			const now = new Date();
			const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

			const session = new Session(
				"session-3",
				"sid-789",
				"user-3",
				"hash-value",
				expiresAt,
				"192.168.0.1",
				"Mobile Safari",
				"iPhone",
				"mobile",
				false,
				now,
			);

			expect(session.deviceType).toBe("mobile");
			expect(session.deviceName).toBe("iPhone");
		});

		it("should allow tablet device type", () => {
			const now = new Date();
			const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

			const session = new Session(
				"session-4",
				"sid-101",
				"user-4",
				"hash-value",
				expiresAt,
				"172.16.0.1",
				"Chrome",
				"iPad",
				"tablet",
				false,
				now,
			);

			expect(session.deviceType).toBe("tablet");
		});

		it("should handle optional createdAt", () => {
			const now = new Date();
			const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

			const session = new Session(
				"session-5",
				"sid-102",
				"user-5",
				"hash-value",
				expiresAt,
				"192.168.1.1",
				"Mozilla/5.0",
				"Firefox",
				"desktop",
				false,
				now,
			);

			expect(session.createdAt).toBeUndefined();
		});

		it("should track expiration date correctly", () => {
			const now = new Date();
			const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

			const session = new Session(
				"session-6",
				"sid-103",
				"user-6",
				"hash-value",
				expiresAt,
				"192.168.1.1",
				"Mozilla/5.0",
				"Chrome",
				"desktop",
				false,
				now,
				now,
			);

			expect(session.expiresAt.getTime()).toBeGreaterThan(now.getTime());
		});

		it("should track last used time", () => {
			const now = new Date();
			const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
			const lastUsed = new Date(now.getTime() - 60 * 60 * 1000);

			const session = new Session(
				"session-7",
				"sid-104",
				"user-7",
				"hash-value",
				expiresAt,
				"192.168.1.1",
				"Mozilla/5.0",
				"Chrome",
				"desktop",
				false,
				lastUsed,
				now,
			);

			expect(session.lastUsedAt).toEqual(lastUsed);
		});
	});
});
