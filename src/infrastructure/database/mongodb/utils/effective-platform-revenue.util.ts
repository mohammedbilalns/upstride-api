import { COIN_VALUE } from "../../../../shared/constants/app.constants";

type RevenueBookingStatus = "PENDING" | "CONFIRMED" | "STARTED" | "COMPLETED";
type RevenuePaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
type RevenuePaymentType = "COINS" | "STRIPE";

export interface EffectiveRevenueBookingLike {
	status: RevenueBookingStatus | string;
	paymentStatus: RevenuePaymentStatus | string;
	paymentType: RevenuePaymentType;
	totalAmount: number;
	endTime: Date;
}

export const roundToTwo = (value: number) =>
	Number((Number.isFinite(value) ? value : 0).toFixed(2));

export const toMonetaryBookingAmount = (
	booking: Pick<EffectiveRevenueBookingLike, "paymentType" | "totalAmount">,
): number =>
	booking.paymentType === "COINS"
		? booking.totalAmount / COIN_VALUE
		: booking.totalAmount;

const isOutstandingUpcomingBooking = (
	booking: Pick<
		EffectiveRevenueBookingLike,
		"status" | "paymentStatus" | "endTime"
	>,
	now: Date,
): boolean =>
	booking.endTime.getTime() > now.getTime() &&
	booking.paymentStatus === "COMPLETED" &&
	["PENDING", "CONFIRMED", "STARTED"].includes(booking.status);

export const sumUpcomingSessionLiability = (
	bookings: EffectiveRevenueBookingLike[],
	now: Date,
): number =>
	roundToTwo(
		bookings.reduce((sum, booking) => {
			if (!isOutstandingUpcomingBooking(booking, now)) {
				return sum;
			}

			return sum + toMonetaryBookingAmount(booking);
		}, 0),
	);

export const calculateEffectivePlatformRevenue = (
	platformWalletBalanceMinor: number,
	bookings: EffectiveRevenueBookingLike[],
	now: Date,
): number =>
	roundToTwo(
		platformWalletBalanceMinor / 100 -
			sumUpcomingSessionLiability(bookings, now),
	);
