import { inject, injectable } from "inversify";
import type { IBookingRepository } from "../../../../domain/repositories/booking.repository.interface";
import type { IPdfReceiptService } from "../../../../infrastructure/services/pdf-receipt.service";
import { TYPES } from "../../../../shared/types/types";
import type {
	GenerateReceiptPdfInput,
	GenerateReceiptPdfResponse,
} from "../dtos/reciept.dto";
import { BookingNotFoundError } from "../errors/booking.errors";
import { BookingMapper } from "../mappers/booking.mapper";
import type { IGenerateReceiptPdfUseCase } from "./generate-receipt-pdf.use-case.interface";

@injectable()
export class GenerateReceiptPdfUseCase implements IGenerateReceiptPdfUseCase {
	constructor(
		@inject(TYPES.Repositories.BookingRepository)
		private readonly _bookingRepository: IBookingRepository,
		@inject(TYPES.Services.PdfReceiptService)
		private readonly _pdfReceiptService: IPdfReceiptService,
	) {}

	async execute(
		input: GenerateReceiptPdfInput,
	): Promise<GenerateReceiptPdfResponse> {
		const booking = await this._bookingRepository.findById(input.bookingId);

		if (
			!booking ||
			(booking.menteeId !== input.userId &&
				booking.mentorUserId !== input.userId)
		) {
			throw new BookingNotFoundError();
		}

		const allowedStatuses = ["CONFIRMED", "STARTED", "COMPLETED"];
		if (!allowedStatuses.includes(booking.status)) {
			throw new Error(
				"Receipt can only be generated for confirmed, started, or completed bookings",
			);
		}

		const dto = BookingMapper.toDto(booking);

		const amountPaid =
			booking.paymentType === "STRIPE" && booking.paymentStatus === "COMPLETED"
				? booking.totalAmount
				: undefined;

		const receiptData = {
			bookingId: booking.id,
			mentorName: dto.mentorName ?? "N/A",
			menteeName: dto.menteeName ?? "N/A",
			startTime: booking.startTime,
			endTime: booking.endTime,
			status: booking.status,
			paymentType: booking.paymentType,
			paymentStatus: booking.paymentStatus,
			totalAmount: booking.totalAmount,
			currency: booking.currency,
			amountPaid,
			meetingLink: booking.meetingLink,
			notes: booking.notes ?? undefined,
			createdAt: booking.createdAt.toISOString(),
		};

		const pdfBuffer =
			await this._pdfReceiptService.generateReceipt(receiptData);
		const filename = `receipt-${booking.id}.pdf`;

		return { pdfBuffer, filename };
	}
}
