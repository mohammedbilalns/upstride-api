import { injectable } from "inversify";
import type { QueryFilter } from "mongoose";
import type {
	PaymentStatus,
	PaymentTransaction,
} from "../../../../domain/entities/payment-transactions.entity";
import type { PaginateParams } from "../../../../domain/repositories";
import type { QueryParams } from "../../../../domain/repositories/capabilities";
import type { PaginatedResult } from "../../../../domain/repositories/capabilities/paginatable.repository.interface";
import type {
	IPaymentTransactionRepository,
	PaymentTransactionQuery,
} from "../../../../domain/repositories/payment-transactions.repository.interface";
import { PaymentTransactionMapper } from "../mappers/payment-transactions.mapper";
import { BookingModel } from "../models/booking.model";
import {
	type PaymentTransactionDocument,
	PaymentTransactionModel,
} from "../models/payment-transactions.model";
import { PlatformWalletModel } from "../models/platform-wallet.model";
import {
	calculateEffectivePlatformRevenue,
	type EffectiveRevenueBookingLike,
} from "../utils/effective-platform-revenue.util";
import { AbstractMongoRepository } from "./abstract.repository";

type EffectiveRevenueBooking = {
	status: string;
	paymentStatus: string;
	paymentType: "STRIPE" | "COINS";
	totalAmount: number;
	endTime: Date;
};

const applyTransactionOwnerFilter = (
	filter: QueryFilter<PaymentTransactionDocument>,
	transactionOwner?: PaymentTransactionQuery["transactionOwner"],
) => {
	if (transactionOwner === "platform") {
		filter.transactionOwner = "platform";
		return;
	}

	if (transactionOwner === "mentor") {
		filter.transactionOwner = "mentor";
		return;
	}

	if (transactionOwner === "user") {
		filter.$or = [
			{ transactionOwner: "user" },
			{ transactionOwner: { $exists: false } },
			{ transactionOwner: null },
			{
				transactionOwner: "" as unknown as NonNullable<
					PaymentTransactionDocument["transactionOwner"]
				>,
			},
		];
	}
};

const buildPaymentTransactionFilter = (
	query?: PaymentTransactionQuery,
): QueryFilter<PaymentTransactionDocument> => {
	const filter: QueryFilter<PaymentTransactionDocument> = {};

	if (query?.userId) {
		filter.userId = query.userId;
	}

	if (query?.provider) {
		filter.provider = query.provider;
	}

	if (query?.status) {
		filter.status = Array.isArray(query.status)
			? { $in: query.status }
			: query.status;
	}

	if (query?.providerPaymentId) {
		filter.providerPaymentId = query.providerPaymentId;
	}

	applyTransactionOwnerFilter(filter, query?.transactionOwner);

	return filter;
};

@injectable()
export class MongoPaymentTransactionRepository
	extends AbstractMongoRepository<
		PaymentTransaction,
		PaymentTransactionDocument
	>
	implements IPaymentTransactionRepository
{
	constructor() {
		super(PaymentTransactionModel);
	}

	protected toDomain(doc: PaymentTransactionDocument): PaymentTransaction {
		return PaymentTransactionMapper.toDomain(doc);
	}

	protected toDocument(
		entity: PaymentTransaction,
	): Partial<PaymentTransactionDocument> {
		return PaymentTransactionMapper.toDocument(entity);
	}

	async create(transaction: PaymentTransaction): Promise<PaymentTransaction> {
		return this.createDocument(transaction);
	}

	async findById(id: string): Promise<PaymentTransaction | null> {
		return this.findByIdDocument(id);
	}

	async findByProviderPaymentIdAndOwner(
		providerPaymentId: string,
		transactionOwner: "platform" | "user" | "mentor",
	): Promise<PaymentTransaction | null> {
		const doc = await this.model
			.findOne({ providerPaymentId, transactionOwner })
			.lean();
		return doc ? this.toDomain(doc as PaymentTransactionDocument) : null;
	}

	async findAllByUserId(userId: string): Promise<PaymentTransaction[]> {
		const docs = await this.model
			.find({ userId })
			.sort({ createdAt: -1 })
			.lean();

		return docs.map((doc) => this.toDomain(doc as PaymentTransactionDocument));
	}

	async updateStatusByProviderPaymentIdAndOwner(
		providerPaymentId: string,
		status: PaymentStatus,
		transactionOwner: "platform" | "user" | "mentor",
	): Promise<PaymentTransaction | null> {
		const doc = await this.model
			.findOneAndUpdate(
				{ providerPaymentId, transactionOwner },
				{ $set: { status } },
				{ returnDocument: "after" },
			)
			.lean();

		return doc ? this.toDomain(doc as PaymentTransactionDocument) : null;
	}

	async getEffectivePlatformRevenue(): Promise<number> {
		const now = new Date();
		const [wallet, bookings] = await Promise.all([
			PlatformWalletModel.findOne({ key: "platform" }, { balance: 1 }).lean<{
				balance: number;
			} | null>(),
			BookingModel.find(
				{
					status: { $in: ["PENDING", "CONFIRMED", "STARTED"] },
					paymentStatus: "COMPLETED",
					endTime: { $gt: now },
				},
				{
					status: 1,
					paymentStatus: 1,
					paymentType: 1,
					totalAmount: 1,
					endTime: 1,
				},
			).lean<EffectiveRevenueBooking[]>(),
		]);

		return calculateEffectivePlatformRevenue(
			wallet?.balance ?? 0,
			bookings as EffectiveRevenueBookingLike[],
			now,
		);
	}

	async query({
		query,
		sort,
	}: QueryParams<PaymentTransactionQuery>): Promise<PaymentTransaction[]> {
		const filter = buildPaymentTransactionFilter(query);

		const docs = await this.model
			.find(filter)
			.sort(sort ?? { createdAt: -1 })
			.lean();

		return docs.map((doc) => this.toDomain(doc as PaymentTransactionDocument));
	}

	async paginate({
		page,
		limit,
		query,
		sort,
	}: PaginateParams<PaymentTransactionQuery>): Promise<
		PaginatedResult<PaymentTransaction>
	> {
		const filter = buildPaymentTransactionFilter(query);

		const skip = (page - 1) * limit;

		const [docs, total] = await Promise.all([
			this.model
				.find(filter)
				.sort(sort ?? { createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			this.model.countDocuments(filter),
		]);

		const items = docs.map((doc) =>
			this.toDomain(doc as PaymentTransactionDocument),
		);

		return this.buildPaginatedResult(items, total, page, limit);
	}
}
