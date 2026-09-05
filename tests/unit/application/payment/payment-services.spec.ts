import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IScheduleSessionSettlementUseCase } from "../../../../src/application/modules/booking/use-cases/schedule-session-settlement.use-case.interface";
import { ConfirmBookingPaymentService } from "../../../../src/application/modules/payment/services/confirm-booking-payment.service";
import { ProcessWalletTopupService } from "../../../../src/application/modules/payment/services/process-wallet-topup.service";
import { RefundService } from "../../../../src/application/modules/payment/services/refund.service";
import { UpsertPaymentTransactionService } from "../../../../src/application/modules/payment/services/upsert-payment-transaction.service";
import type { JobQueuePort } from "../../../../src/application/ports/job-queue.port";
import type { IIdGenerator } from "../../../../src/application/services/id-generator.service.interface";
import type { IWalletService } from "../../../../src/application/services/wallet.service.interface";
import {
	PaymentProvider,
	PaymentStatus,
} from "../../../../src/domain/entities/payment-transactions.entity";
import type { IBookingRepository } from "../../../../src/domain/repositories/booking.repository.interface";
import type { IMentorProfileReadRepository } from "../../../../src/domain/repositories/mentor-profile-read.repository.interface";
import type { IPaymentTransactionRepository } from "../../../../src/domain/repositories/payment-transactions.repository.interface";
import type { IPlatformWalletRepository } from "../../../../src/domain/repositories/platform-wallet.repository.interface";
import { createBooking } from "../../../factories/entities/booking.factory";
import { createPaymentTransaction } from "../../../factories/entities/payment-transaction.factory";
import { createMock } from "../../../factories/utilities/create-mock";

vi.mock(
	"../../../../src/application/modules/booking/utils/check-booking-conflict.util",
	() => ({
		checkBookingConflict: vi.fn(),
	}),
);

import { checkBookingConflict } from "../../../../src/application/modules/booking/utils/check-booking-conflict.util";

describe("payment services", () => {
	let bookingRepository: ReturnType<typeof createMock<IBookingRepository>>;
	let mentorRepository: ReturnType<
		typeof createMock<IMentorProfileReadRepository>
	>;
	let paymentTransactionRepository: ReturnType<
		typeof createMock<IPaymentTransactionRepository>
	>;
	let platformWalletRepository: ReturnType<
		typeof createMock<IPlatformWalletRepository>
	>;
	let idGenerator: ReturnType<typeof createMock<IIdGenerator>>;
	let jobQueue: ReturnType<typeof createMock<JobQueuePort>>;
	let scheduleSettlementUseCase: ReturnType<
		typeof createMock<IScheduleSessionSettlementUseCase>
	>;
	let walletService: ReturnType<typeof createMock<IWalletService>>;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-07-24T08:00:00.000Z"));

		bookingRepository = createMock<IBookingRepository>();
		mentorRepository = createMock<IMentorProfileReadRepository>();
		paymentTransactionRepository = createMock<IPaymentTransactionRepository>();
		platformWalletRepository = createMock<IPlatformWalletRepository>();
		idGenerator = createMock<IIdGenerator>();
		jobQueue = createMock<JobQueuePort>();
		scheduleSettlementUseCase = createMock<IScheduleSessionSettlementUseCase>();
		walletService = createMock<IWalletService>();

		idGenerator.generate.mockReturnValue("generated-id");
		vi.mocked(checkBookingConflict).mockResolvedValue(false);
	});

	it("confirms a stripe booking, schedules reminders, and writes ledger entries", async () => {
		const service = new ConfirmBookingPaymentService(
			bookingRepository,
			mentorRepository,
			paymentTransactionRepository,
			platformWalletRepository,
			idGenerator,
			jobQueue,
			scheduleSettlementUseCase,
		);
		const booking = createBooking({
			id: "booking-1",
			mentorId: "mentor-1",
			mentorUserId: "mentor-user-1",
			menteeId: "mentee-1",
			startTime: "2026-07-24T10:00:00.000Z",
			endTime: "2026-07-24T11:00:00.000Z",
			meetingLink: "Pending",
			paymentStatus: "PENDING",
			status: "PENDING",
		});

		bookingRepository.findById.mockResolvedValue(booking);
		bookingRepository.findByMentorIdAndDate.mockResolvedValue([
			booking,
			createBooking({
				id: "booking-2",
				mentorId: "mentor-1",
				startTime: "2026-07-24T10:30:00.000Z",
				endTime: "2026-07-24T11:30:00.000Z",
				paymentStatus: "FAILED",
				status: "PENDING",
			}),
		]);

		await service.confirm({
			bookingId: "booking-1",
			sessionId: "cs_test_1",
			amountMinor: 4500,
			currency: "inr",
		});

		expect(bookingRepository.updateById).toHaveBeenCalledWith("booking-1", {
			status: "CONFIRMED",
			paymentStatus: "COMPLETED",
			meetingLink: "http://localhost:5173/sessions/booking-1",
		});
		expect(bookingRepository.updateById).toHaveBeenCalledWith("booking-2", {
			status: "SLOT_TAKEN_BY_ANOTHER_USER",
		});
		expect(jobQueue.enqueue).toHaveBeenCalledTimes(2);
		expect(scheduleSettlementUseCase.execute).toHaveBeenCalledWith({
			bookingId: "booking-1",
			endTime: new Date("2026-07-24T11:00:00.000Z"),
		});
		expect(paymentTransactionRepository.create).toHaveBeenCalledTimes(2);
		expect(platformWalletRepository.incrementBalance).toHaveBeenCalledWith(
			4500,
		);
	});

	it("returns early when the booking is missing or already completed", async () => {
		const service = new ConfirmBookingPaymentService(
			bookingRepository,
			mentorRepository,
			paymentTransactionRepository,
			platformWalletRepository,
			idGenerator,
			jobQueue,
			scheduleSettlementUseCase,
		);
		bookingRepository.findById.mockResolvedValueOnce(null);

		await service.confirm({
			bookingId: "missing",
			sessionId: "cs_missing",
			amountMinor: 1000,
			currency: "inr",
		});

		bookingRepository.findById.mockResolvedValueOnce(
			createBooking({ paymentStatus: "COMPLETED" }),
		);

		await service.confirm({
			bookingId: "booking-1",
			sessionId: "cs_done",
			amountMinor: 1000,
			currency: "inr",
		});

		expect(bookingRepository.updateById).not.toHaveBeenCalled();
		expect(paymentTransactionRepository.create).not.toHaveBeenCalled();
	});

	it("upserts a payment transaction by creating a new completed entry", async () => {
		const service = new UpsertPaymentTransactionService(
			paymentTransactionRepository,
			idGenerator,
		);

		await service.upsert({
			existing: null,
			userId: "user-1",
			provider: PaymentProvider.Stripe,
			sessionId: "cs_123",
			amountMinor: 5000,
			currency: "inr",
			coins: 100,
			purpose: "coins",
			owner: "user",
		});

		expect(paymentTransactionRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "generated-id",
				providerPaymentId: "cs_123",
				status: PaymentStatus.Completed,
				coinsGranted: 100,
				transactionOwner: "user",
			}),
		);
	});

	it("upserts a payment transaction by marking a pending one complete", async () => {
		const service = new UpsertPaymentTransactionService(
			paymentTransactionRepository,
			idGenerator,
		);

		await service.upsert({
			existing: createPaymentTransaction({ status: PaymentStatus.Pending }),
			userId: "user-1",
			provider: PaymentProvider.Stripe,
			sessionId: "cs_123",
			amountMinor: 5000,
			currency: "inr",
			coins: 100,
			purpose: "coins",
			owner: "platform",
		});

		expect(
			paymentTransactionRepository.updateStatusByProviderPaymentIdAndOwner,
		).toHaveBeenCalledWith("cs_123", PaymentStatus.Completed, "platform");
	});

	it("processes a wallet top-up only once for a completed checkout", async () => {
		const upsertPaymentTransactionService = createMock<{
			upsert: (input: unknown) => Promise<void>;
		}>();
		const service = new ProcessWalletTopupService(
			paymentTransactionRepository,
			walletService,
			upsertPaymentTransactionService,
		);

		await service.process({
			userId: "",
			coins: 10,
			currency: "inr",
			amountMinor: 200,
			sessionId: "cs_invalid",
			provider: PaymentProvider.Stripe,
		});
		expect(upsertPaymentTransactionService.upsert).not.toHaveBeenCalled();

		paymentTransactionRepository.findByProviderPaymentIdAndOwner.mockResolvedValue(
			createPaymentTransaction({ status: PaymentStatus.Completed }),
		);
		await service.process({
			userId: "user-1",
			coins: 10,
			currency: "inr",
			amountMinor: 200,
			sessionId: "cs_completed",
			provider: PaymentProvider.Stripe,
		});
		expect(walletService.credit).not.toHaveBeenCalled();

		paymentTransactionRepository.findByProviderPaymentIdAndOwner.mockResolvedValue(
			null,
		);
		await service.process({
			userId: "user-1",
			coins: 10,
			currency: "inr",
			amountMinor: 200,
			sessionId: "cs_new",
			provider: PaymentProvider.Stripe,
		});

		expect(upsertPaymentTransactionService.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user-1",
				sessionId: "cs_new",
				coins: 10,
			}),
		);
		expect(walletService.credit).toHaveBeenCalledWith(
			"user-1",
			10,
			"purchase",
			PaymentProvider.Stripe,
			"cs_new",
		);
	});

	it("processes refunds for coins and stripe payments", async () => {
		const service = new RefundService(
			walletService,
			paymentTransactionRepository,
			platformWalletRepository,
			idGenerator,
		);
		paymentTransactionRepository.findByProviderPaymentIdAndOwner.mockResolvedValue(
			null,
		);

		await service.processRefund({
			bookingId: "booking-1",
			userId: "user-1",
			refundAmount: 100,
			refundAmountMinor: 5000,
			cancelledBy: "user",
			paymentType: "STRIPE",
		});

		expect(walletService.credit).toHaveBeenCalledWith(
			"user-1",
			100,
			"refund",
			"session_booking",
			"booking-1",
		);
		expect(paymentTransactionRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				providerPaymentId: "refund_booking-1",
				amount: -5000,
			}),
		);
		expect(platformWalletRepository.incrementBalance).toHaveBeenCalledWith(
			-5000,
		);
	});
});
