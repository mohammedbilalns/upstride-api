import { beforeEach, describe, expect, it } from "vitest";
import { MentorNoShowService } from "../../../../src/application/modules/booking/services/mentor-no-show.service";
import { MentorSessionPayoutService } from "../../../../src/application/modules/booking/services/mentor-session-payout.service";
import { SessionRefundService } from "../../../../src/application/modules/booking/services/session-refund.service";
import { SessionSettlementCalculatorService } from "../../../../src/application/modules/booking/services/session-settlement-calculator.service";
import type { ICreateNotificationUseCase } from "../../../../src/application/modules/notification/use-cases/create-notification.use-case.interface";
import type { IIdGenerator } from "../../../../src/application/services/id-generator.service.interface";
import { REFRESH_TOKEN_EXPIRES_IN_SECONDS } from "../../../../src/application/services/token.service.interface";
import type { IWalletService } from "../../../../src/application/services/wallet.service.interface";
import type { IMentorWriteRepository } from "../../../../src/domain/repositories/mentor-write.repository.interface";
import type { IPaymentTransactionRepository } from "../../../../src/domain/repositories/payment-transactions.repository.interface";
import type { IPlatformWalletRepository } from "../../../../src/domain/repositories/platform-wallet.repository.interface";
import type { ISessionRepository } from "../../../../src/domain/repositories/session.repository.interface";
import type { ITokenRevocationRepository } from "../../../../src/domain/repositories/token-revocation.repository.interface";
import type { IUserRepository } from "../../../../src/domain/repositories/user.repository.interface";
import { createBooking } from "../../../factories/entities/booking.factory";
import { createMentor } from "../../../factories/entities/mentor.factory";
import { createSession } from "../../../factories/entities/session.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("booking services", () => {
	let mentorWriteRepository: ReturnType<
		typeof createMock<IMentorWriteRepository>
	>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let sessionRepository: ReturnType<typeof createMock<ISessionRepository>>;
	let tokenRevocationRepository: ReturnType<
		typeof createMock<ITokenRevocationRepository>
	>;
	let createNotificationUseCase: ReturnType<
		typeof createMock<ICreateNotificationUseCase>
	>;
	let walletService: ReturnType<typeof createMock<IWalletService>>;
	let paymentTransactionRepository: ReturnType<
		typeof createMock<IPaymentTransactionRepository>
	>;
	let platformWalletRepository: ReturnType<
		typeof createMock<IPlatformWalletRepository>
	>;
	let idGenerator: ReturnType<typeof createMock<IIdGenerator>>;

	beforeEach(() => {
		mentorWriteRepository = createMock<IMentorWriteRepository>();
		userRepository = createMock<IUserRepository>();
		sessionRepository = createMock<ISessionRepository>();
		tokenRevocationRepository = createMock<ITokenRevocationRepository>();
		createNotificationUseCase = createMock<ICreateNotificationUseCase>();
		walletService = createMock<IWalletService>();
		paymentTransactionRepository = createMock<IPaymentTransactionRepository>();
		platformWalletRepository = createMock<IPlatformWalletRepository>();
		idGenerator = createMock<IIdGenerator>();
		idGenerator.generate.mockReturnValue("generated-id");
	});

	it("records a mentor no-show and returns the next skipped count", async () => {
		const service = new MentorNoShowService(
			mentorWriteRepository,
			userRepository,
			sessionRepository,
			tokenRevocationRepository,
			createNotificationUseCase,
		);
		mentorWriteRepository.findByUserId.mockResolvedValue(
			createMentor({
				id: "mentor-1",
				userId: "mentor-user-1",
				skippedSessionsCount: 2,
			}),
		);

		const result = await service.recordNoShow("mentor-user-1");

		expect(result).toBe(3);
		expect(mentorWriteRepository.updateById).toHaveBeenCalledWith("mentor-1", {
			skippedSessionsCount: 3,
		});
	});

	it("returns zero for no-show tracking when the mentor record is missing", async () => {
		const service = new MentorNoShowService(
			mentorWriteRepository,
			userRepository,
			sessionRepository,
			tokenRevocationRepository,
			createNotificationUseCase,
		);
		mentorWriteRepository.findByUserId.mockResolvedValue(null);

		await expect(service.recordNoShow("mentor-user-1")).resolves.toBe(0);
		expect(mentorWriteRepository.updateById).not.toHaveBeenCalled();
	});

	it("blocks a mentor, revokes active sessions, and notifies them", async () => {
		const service = new MentorNoShowService(
			mentorWriteRepository,
			userRepository,
			sessionRepository,
			tokenRevocationRepository,
			createNotificationUseCase,
		);
		sessionRepository.findAllByUserId.mockResolvedValue([
			createSession({ sid: "sid-1", revoked: false }),
			createSession({ sid: "sid-2", revoked: true }),
			createSession({ sid: "sid-3", revoked: false }),
		]);

		await service.blockMentor("mentor-user-1");

		expect(userRepository.updateById).toHaveBeenCalledWith("mentor-user-1", {
			isBlocked: true,
		});
		expect(
			mentorWriteRepository.updateIsUserBlockedStatusByUserId,
		).toHaveBeenCalledWith("mentor-user-1", true);
		expect(sessionRepository.revokeMultiple).toHaveBeenCalledWith([
			"sid-1",
			"sid-3",
		]);
		expect(tokenRevocationRepository.revokeMultiple).toHaveBeenCalledWith([
			{ sessionId: "sid-1", ttl: REFRESH_TOKEN_EXPIRES_IN_SECONDS },
			{ sessionId: "sid-3", ttl: REFRESH_TOKEN_EXPIRES_IN_SECONDS },
		]);
		expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "mentor-user-1",
				event: "MENTOR_BLOCKED",
			}),
		);
	});

	it("credits mentor payout only for non-zero amounts", async () => {
		const service = new MentorSessionPayoutService(
			walletService,
			paymentTransactionRepository,
			platformWalletRepository,
			idGenerator,
			createNotificationUseCase,
		);
		const booking = createBooking({
			id: "booking-1",
			menteeId: "mentee-1",
			paymentType: "STRIPE",
		});
		const settledAt = new Date("2026-07-24T10:00:00.000Z");

		await service.creditMentor(booking, "mentor-user-1", 120, 8500, settledAt);

		expect(walletService.credit).toHaveBeenCalledWith(
			"mentor-user-1",
			120,
			"session_earning",
			"Booking",
			"booking-1",
		);
		expect(platformWalletRepository.incrementBalance).toHaveBeenCalledWith(
			-8500,
		);
		expect(paymentTransactionRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "generated-id",
				providerPaymentId: "session_payout_booking-1",
				amount: -8500,
				transactionOwner: "platform",
			}),
		);
		expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "mentor-user-1",
				event: "SESSION_EARNED",
			}),
		);
	});

	it("refunds a booked user and avoids duplicate platform refund transactions", async () => {
		const service = new SessionRefundService(
			walletService,
			paymentTransactionRepository,
			platformWalletRepository,
			idGenerator,
			createNotificationUseCase,
		);
		const booking = createBooking({
			id: "booking-2",
			menteeId: "mentee-1",
			paymentType: "STRIPE",
		});
		paymentTransactionRepository.findByProviderPaymentIdAndOwner.mockResolvedValue(
			null,
		);

		await service.refundBookedUser(booking, 100, 5000, new Date("2026-07-24"));

		expect(walletService.credit).toHaveBeenCalledWith(
			"mentee-1",
			100,
			"refund",
			"session_booking",
			"booking-2",
		);
		expect(paymentTransactionRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				providerPaymentId: "refund_booking-2",
				amount: -5000,
			}),
		);
		expect(platformWalletRepository.incrementBalance).toHaveBeenCalledWith(
			-5000,
		);
		expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "mentee-1",
				event: "SESSION_REFUNDED",
			}),
		);
	});

	it("skips refund work when there is no refundable amount", async () => {
		const service = new SessionRefundService(
			walletService,
			paymentTransactionRepository,
			platformWalletRepository,
			idGenerator,
			createNotificationUseCase,
		);

		await service.refundBookedUser(
			createBooking(),
			0,
			0,
			new Date("2026-07-24"),
		);

		expect(walletService.credit).not.toHaveBeenCalled();
		expect(paymentTransactionRepository.create).not.toHaveBeenCalled();
	});

	it("calculates settlement amounts for coin and stripe bookings", () => {
		const service = new SessionSettlementCalculatorService();

		expect(
			service.calculate(
				createBooking({ paymentType: "COINS", totalAmount: 1000 }),
			),
		).toEqual({
			mentorCoins: 850,
			mentorPayoutMinor: 42500,
			refundCoins: 1000,
			refundMinor: 50000,
		});

		expect(
			service.calculate(
				createBooking({ paymentType: "STRIPE", totalAmount: 1000 }),
			),
		).toEqual({
			mentorCoins: 1700,
			mentorPayoutMinor: 85000,
			refundCoins: 2000,
			refundMinor: 100000,
		});
	});
});
