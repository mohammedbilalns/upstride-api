import { injectable } from "inversify";
import type { QueryFilter } from "mongoose";
import type { CoinTransaction } from "../../../../domain/entities/coin-transactions.entity";
import type { PaginateParams } from "../../../../domain/repositories";
import type { QueryParams } from "../../../../domain/repositories/capabilities";
import type { PaginatedResult } from "../../../../domain/repositories/capabilities/paginatable.repository.interface";
import type {
	CoinTransactionQuery,
	ICoinTransactionRepository,
} from "../../../../domain/repositories/coin-transactions.repository.interface";
import { CoinTransactionMapper } from "../mappers/coin-transactions.mapper";
import {
	type CoinTransactionDocument,
	CoinTransactionModel,
} from "../models/coin-transactions.model";
import { AbstractMongoRepository } from "./abstract.repository";

@injectable()
export class MongoCoinTransactionRepository
	extends AbstractMongoRepository<CoinTransaction, CoinTransactionDocument>
	implements ICoinTransactionRepository
{
	constructor() {
		super(CoinTransactionModel);
	}

	protected toDomain(doc: CoinTransactionDocument): CoinTransaction {
		return CoinTransactionMapper.toDomain(doc);
	}

	protected toDocument(
		entity: CoinTransaction,
	): Partial<CoinTransactionDocument> {
		return CoinTransactionMapper.toDocument(entity);
	}

	async create(transaction: CoinTransaction): Promise<CoinTransaction> {
		return this.createDocument(transaction);
	}

	async findById(id: string): Promise<CoinTransaction | null> {
		return this.findByIdDocument(id);
	}

	async findAllByUserId(userId: string): Promise<CoinTransaction[]> {
		const docs = await this.model
			.find({ userId })
			.sort({ createdAt: -1 })
			.lean();

		return docs.map((doc) => this.toDomain(doc as CoinTransactionDocument));
	}

	async query({
		query,
		sort,
	}: QueryParams<CoinTransactionQuery>): Promise<CoinTransaction[]> {
		const filter = this._buildFilter(query);

		const docs = await this.model
			.find(filter)
			.sort(sort ?? { createdAt: -1 })
			.lean();

		return docs.map((doc) => this.toDomain(doc as CoinTransactionDocument));
	}

	async paginate({
		page,
		limit,
		query,
		sort,
	}: PaginateParams<CoinTransactionQuery>): Promise<
		PaginatedResult<CoinTransaction>
	> {
		const filter = this._buildFilter(query);

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
			this.toDomain(doc as CoinTransactionDocument),
		);

		return this.buildPaginatedResult(items, total, page, limit);
	}

	private _buildFilter(
		query?: CoinTransactionQuery,
	): QueryFilter<CoinTransactionDocument> {
		const filter: QueryFilter<CoinTransactionDocument> = {};

		if (!query) return filter;

		Object.assign(filter, {
			...(query.userId && { userId: query.userId }),
			...(query.referenceType && { referenceType: query.referenceType }),
			...(query.referenceId && { referenceId: query.referenceId }),
		});

		if (query.type) {
			filter.type = Array.isArray(query.type)
				? { $in: query.type }
				: query.type;
		}

		if (query.transactionOwner === "platform") {
			filter.transactionOwner = "platform";
		} else if (query.transactionOwner === "user") {
			filter.$or = [
				{ transactionOwner: "user" },
				{ transactionOwner: { $exists: false } },
				{ transactionOwner: null },
				{
					transactionOwner: "" as unknown as NonNullable<
						CoinTransactionDocument["transactionOwner"]
					>,
				},
			];
		}

		return filter;
	}
}
