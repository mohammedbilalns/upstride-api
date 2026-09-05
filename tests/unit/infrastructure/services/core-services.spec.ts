import { beforeEach, describe, expect, it, vi } from "vitest";

const { argonHashMock, argonVerifyMock } = vi.hoisted(() => ({
	argonHashMock: vi.fn(),
	argonVerifyMock: vi.fn(),
}));

vi.mock("argon2", () => ({
	default: {
		hash: argonHashMock,
		verify: argonVerifyMock,
	},
}));

import { UserNotFoundError } from "../../../../src/application/modules/authentication/errors";
import type { IIdGenerator } from "../../../../src/application/services/id-generator.service.interface";
import { CoinTransactionType } from "../../../../src/domain/entities/coin-transactions.entity";
import type { ICoinTransactionRepository } from "../../../../src/domain/repositories/coin-transactions.repository.interface";
import type { IUserRepository } from "../../../../src/domain/repositories/user.repository.interface";
import { LRUFeedCacheService } from "../../../../src/infrastructure/cache/lru-feed-cache.service";
import { JwtTokenService } from "../../../../src/infrastructure/services/jwt-token.service";
import { CryptoOtpGenerator } from "../../../../src/infrastructure/services/otp-generator.service";
import { Argon2PasswordService } from "../../../../src/infrastructure/services/password.service";
import { PdfReceiptService } from "../../../../src/infrastructure/services/pdf-receipt.service";
import { UuidGenerator } from "../../../../src/infrastructure/services/uuid-generator.service";
import { WalletService } from "../../../../src/infrastructure/services/wallet.service";
import { createCoinTransaction } from "../../../factories/entities/coin-transactions.factory";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("core infrastructure services", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		argonHashMock.mockReset();
		argonVerifyMock.mockReset();
	});

	it("stores feed ids in the LRU cache and expires entries by ttl", () => {
		vi.useFakeTimers();
		const service = new LRUFeedCacheService();

		service.set("feed:user-1", ["a", "b"]);
		expect(service.get("feed:user-1")).toEqual(["a", "b"]);

		vi.advanceTimersByTime(10 * 60 * 1000 + 1);
		expect(service.get("feed:user-1")).toBeNull();
	});

	it("generates and verifies jwt tokens and hashes refresh tokens", async () => {
		const service = new JwtTokenService(
			new TextEncoder().encode("access"),
			new TextEncoder().encode("refresh"),
			new TextEncoder().encode("reset"),
			new TextEncoder().encode("setup"),
		);

		const accessToken = await service.generateAccessToken({
			sub: "user-1",
			role: "USER",
			jti: "jti-access",
			sid: "sid-1",
		});
		const refreshToken = await service.generateRefreshToken({
			sub: "user-1",
			jti: "jti-refresh",
			sid: "sid-1",
		});

		await expect(service.verifyAccessToken(accessToken)).resolves.toEqual(
			expect.objectContaining({
				sub: "user-1",
				role: "USER",
				jti: "jti-access",
				sid: "sid-1",
			}),
		);
		await expect(service.verifyRefreshToken(refreshToken)).resolves.toEqual(
			expect.objectContaining({
				sub: "user-1",
				jti: "jti-refresh",
				sid: "sid-1",
			}),
		);
		expect(service.hashToken("refresh-token")).toMatch(/^[a-f0-9]{64}$/);
	});

	it("generates OTPs using cryptographic random digits", () => {
		const service = new CryptoOtpGenerator();
		const otp = service.generate(6);
		expect(otp).toMatch(/^\d{6}$/);
	});

	it("wraps argon2 for hashing and verifying passwords", async () => {
		argonHashMock.mockResolvedValue("hashed");
		argonVerifyMock.mockResolvedValue(true);
		const service = new Argon2PasswordService();

		await expect(service.hashPassword("secret")).resolves.toBe("hashed");
		await expect(service.verifyPassword("secret", "hashed")).resolves.toBe(
			true,
		);
		await expect(service.fakeVerify()).resolves.toBe(false);
		expect(argonHashMock).toHaveBeenCalledWith("secret");
		expect(argonVerifyMock).toHaveBeenCalledWith("hashed", "secret");
	});

	it("generates receipt pdfs as non-empty buffers", async () => {
		const service = new PdfReceiptService();

		const buffer = await service.generateReceipt({
			bookingId: "booking-1",
			mentorName: "Mentor",
			menteeName: "Mentee",
			startTime: "2026-07-24T10:00:00.000Z",
			endTime: "2026-07-24T11:00:00.000Z",
			status: "CONFIRMED",
			paymentType: "STRIPE",
			paymentStatus: "COMPLETED",
			totalAmount: 1000,
			currency: "INR",
			amountPaid: 1000,
			createdAt: "2026-07-24T09:00:00.000Z",
			notes: "Bring your portfolio",
		});

		expect(buffer.length).toBeGreaterThan(0);
		expect(buffer.toString("utf8", 0, 4)).toBe("%PDF");
	});

	it("generates uuid values", () => {
		const service = new UuidGenerator();
		const generated = service.generate();
		const many = service.generateMany(3);

		expect(generated).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
		expect(many).toHaveLength(3);
		expect(new Set(many).size).toBe(3);
	});

	it("credits and debits wallet balances while creating coin transactions", async () => {
		const userRepository = createMock<IUserRepository>();
		const transactionRepository = createMock<ICoinTransactionRepository>();
		const idGenerator = createMock<IIdGenerator>();
		idGenerator.generate.mockReturnValue("txn-1");
		transactionRepository.create.mockResolvedValue(
			createCoinTransaction({ id: "txn-1" }),
		);

		const service = new WalletService(
			userRepository,
			transactionRepository,
			idGenerator,
		);

		await expect(
			service.credit(
				"user-1",
				50,
				CoinTransactionType.Purchase,
				"stripe",
				"pi_1",
			),
		).resolves.toBe("txn-1");
		expect(userRepository.incrementBalance).toHaveBeenCalledWith("user-1", 50);

		userRepository.findById.mockResolvedValue(createUser({ coinBalance: 100 }));
		await expect(
			service.debit(
				"user-1",
				40,
				CoinTransactionType.SessionSpend,
				"booking",
				"booking-1",
			),
		).resolves.toBe("txn-1");
		expect(userRepository.incrementBalance).toHaveBeenCalledWith("user-1", -40);

		userRepository.findById.mockResolvedValue(null);
		await expect(
			service.debit("missing", 20, CoinTransactionType.SessionSpend),
		).rejects.toBeInstanceOf(UserNotFoundError);

		userRepository.findById.mockResolvedValue(createUser({ coinBalance: 10 }));
		await expect(
			service.debit("user-1", 20, CoinTransactionType.SessionSpend),
		).rejects.toThrow("Insufficient balance");
	});
});
