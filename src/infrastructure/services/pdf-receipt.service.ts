import { Writable } from "node:stream";
import PDFDocument from "pdfkit";

export interface ReceiptData {
	bookingId: string;
	mentorName: string;
	menteeName: string;
	startTime: string;
	endTime: string;
	status: string;
	paymentType: "COINS" | "STRIPE";
	paymentStatus: string;
	totalAmount: number;
	currency: string;
	amountPaid?: number;
	meetingLink?: string;
	notes?: string;
	createdAt: string;
}

export interface IPdfReceiptService {
	generateReceipt(data: ReceiptData): Promise<Buffer>;
}

export class PdfReceiptService implements IPdfReceiptService {
	async generateReceipt(data: ReceiptData): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			try {
				const doc = new PDFDocument({ margin: 50, size: "A4" });
				const buffers: Buffer[] = [];

				const writable = new Writable({
					write(chunk, _encoding, next) {
						buffers.push(chunk);
						next();
					},
				});

				doc.pipe(writable);

				const isDirectPayment = data.paymentType === "STRIPE";
				const startDate = new Date(data.startTime);
				const endDate = new Date(data.endTime);
				const durationMinutes = Math.round(
					(endDate.getTime() - startDate.getTime()) / 60000,
				);

				const formatDateTime = (date: Date) =>
					date.toLocaleDateString("en-IN", {
						year: "numeric",
						month: "long",
						day: "numeric",
					}) +
					" at " +
					date.toLocaleTimeString("en-IN", {
						hour: "2-digit",
						minute: "2-digit",
						hour12: true,
					});

				const formatCurrency = (amount: number, currency: string) => {
					// Use INR instead of unicode rupee symbol to avoid font errors in default PDFKit fonts.
					const symbol =
						currency.toLowerCase() === "inr" ? "INR " : `${currency} `;
					return `${symbol}${amount.toFixed(2)}`;
				};

				doc
					.font("Helvetica-Bold")
					.fontSize(24)
					.fillColor("#6366f1")
					.text("Upstride", { align: "center" });
				doc
					.fontSize(16)
					.fillColor("#374151")
					.text("Session Receipt", { align: "center" });
				doc.moveDown(0.5);
				doc
					.font("Helvetica")
					.fontSize(10)
					.fillColor("#6b7280")
					.text(`Receipt ID: ${data.bookingId}`, { align: "center" });
				doc
					.font("Helvetica-Bold")
					.text(`Status: ${data.status.replace(/_/g, " ")}`, {
						align: "center",
					});
				doc.moveDown(2);

				doc
					.font("Helvetica-Bold")
					.fontSize(14)
					.fillColor("#374151")
					.text("Session Details");
				doc
					.moveTo(50, doc.y)
					.lineTo(545, doc.y)
					.strokeColor("#e5e7eb")
					.stroke();
				doc.moveDown(1);

				const leftColX = 50;
				const rightColX = 300;
				let currentY = doc.y;

				doc
					.font("Helvetica-Bold")
					.fontSize(10)
					.fillColor("#6b7280")
					.text("MENTOR", leftColX, currentY);
				doc
					.font("Helvetica")
					.fontSize(12)
					.fillColor("#1f2937")
					.text(data.mentorName || "N/A", leftColX, currentY + 12);

				doc
					.font("Helvetica-Bold")
					.fontSize(10)
					.fillColor("#6b7280")
					.text("MENTEE", rightColX, currentY);
				doc
					.font("Helvetica")
					.fontSize(12)
					.fillColor("#1f2937")
					.text(data.menteeName || "N/A", rightColX, currentY + 12);

				currentY += 40;

				doc
					.font("Helvetica-Bold")
					.fontSize(10)
					.fillColor("#6b7280")
					.text("START TIME", leftColX, currentY);
				doc
					.font("Helvetica")
					.fontSize(12)
					.fillColor("#1f2937")
					.text(formatDateTime(startDate), leftColX, currentY + 12);

				doc
					.font("Helvetica-Bold")
					.fontSize(10)
					.fillColor("#6b7280")
					.text("END TIME", rightColX, currentY);
				doc
					.font("Helvetica")
					.fontSize(12)
					.fillColor("#1f2937")
					.text(formatDateTime(endDate), rightColX, currentY + 12);

				currentY += 40;

				doc
					.font("Helvetica-Bold")
					.fontSize(10)
					.fillColor("#6b7280")
					.text("DURATION", leftColX, currentY);
				doc
					.font("Helvetica")
					.fontSize(12)
					.fillColor("#1f2937")
					.text(`${durationMinutes} minutes`, leftColX, currentY + 12);

				doc
					.font("Helvetica-Bold")
					.fontSize(10)
					.fillColor("#6b7280")
					.text("BOOKED ON", rightColX, currentY);
				doc
					.font("Helvetica")
					.fontSize(12)
					.fillColor("#1f2937")
					.text(
						formatDateTime(new Date(data.createdAt)),
						rightColX,
						currentY + 12,
					);

				doc.moveDown(4);

				doc
					.font("Helvetica-Bold")
					.fontSize(14)
					.fillColor("#374151")
					.text("Payment Information", 50, doc.y);
				doc
					.moveTo(50, doc.y)
					.lineTo(545, doc.y)
					.strokeColor("#e5e7eb")
					.stroke();
				doc.moveDown(1);

				const paymentY = doc.y;

				doc
					.rect(
						50,
						paymentY,
						495,
						isDirectPayment && data.amountPaid !== undefined ? 110 : 80,
					)
					.fillOpacity(1)
					.fill("#f9fafb");

				let payRowY = paymentY + 15;
				doc
					.fillColor("#6b7280")
					.font("Helvetica")
					.fontSize(12)
					.text("Payment Method", 65, payRowY);
				doc
					.fillColor("#1f2937")
					.font("Helvetica-Bold")
					.text(
						isDirectPayment ? "Direct Payment (Stripe)" : "Coins",
						65,
						payRowY,
						{ align: "right", width: 465 },
					);

				payRowY += 25;
				doc
					.fillColor("#6b7280")
					.font("Helvetica")
					.fontSize(12)
					.text("Payment Status", 65, payRowY);
				doc
					.fillColor("#1f2937")
					.font("Helvetica-Bold")
					.text(data.paymentStatus, 65, payRowY, {
						align: "right",
						width: 465,
					});

				payRowY += 25;
				doc
					.fillColor("#6b7280")
					.font("Helvetica")
					.fontSize(12)
					.text("Session Cost", 65, payRowY);
				doc
					.fillColor("#1f2937")
					.font("Helvetica-Bold")
					.text(formatCurrency(data.totalAmount, data.currency), 65, payRowY, {
						align: "right",
						width: 465,
					});

				if (isDirectPayment && data.amountPaid !== undefined) {
					payRowY += 25;
					doc
						.fillColor("#374151")
						.font("Helvetica-Bold")
						.fontSize(14)
						.text("Amount Paid", 65, payRowY);
					doc
						.fillColor("#6366f1")
						.font("Helvetica-Bold")
						.fontSize(16)
						.text(
							formatCurrency(data.amountPaid, data.currency),
							65,
							payRowY - 2,
							{ align: "right", width: 465 },
						);
				}

				if (data.notes) {
					doc.y =
						doc.y +
						(isDirectPayment && data.amountPaid !== undefined ? 40 : 20);
					doc
						.fillColor("#374151")
						.font("Helvetica-Bold")
						.fontSize(14)
						.text("Notes", 50, doc.y);
					doc
						.moveTo(50, doc.y)
						.lineTo(545, doc.y)
						.strokeColor("#e5e7eb")
						.stroke();
					doc.moveDown(1);
					doc
						.fillColor("#6b7280")
						.font("Helvetica-Oblique")
						.fontSize(12)
						.text(data.notes);
				}

				doc.y = 700;
				doc
					.moveTo(50, doc.y)
					.lineTo(545, doc.y)
					.strokeColor("#e5e7eb")
					.stroke();
				doc.moveDown(1);
				doc
					.fillColor("#6b7280")
					.font("Helvetica")
					.fontSize(10)
					.text(
						"This is a system-generated receipt for your Upstride mentoring session.",
						{ align: "center" },
					);
				doc.moveDown(0.5);
				doc.text(`Generated on ${formatDateTime(new Date())}`, {
					align: "center",
				});

				doc.end();

				writable.on("finish", () => {
					resolve(Buffer.concat(buffers));
				});

				writable.on("error", (err) => {
					reject(err);
				});

				doc.on("error", (err) => {
					reject(err);
				});
			} catch (error) {
				reject(error);
			}
		});
	}
}
