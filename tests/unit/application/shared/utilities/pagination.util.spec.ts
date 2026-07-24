import { describe, expect, it } from "vitest";
import {
	buildPaginationMeta,
	emptyPaginatedResult,
	mapPaginatedResult,
} from "../../../../../src/application/shared/utilities/pagination.util";
import type { PaginatedResult } from "../../../../../src/domain/repositories/capabilities";

describe("pagination.util", () => {
	describe("emptyPaginatedResult", () => {
		it("should return an empty result with the given page and limit", () => {
			const result = emptyPaginatedResult(1, 10);

			expect(result).toEqual({
				items: [],
				total: 0,
				page: 1,
				limit: 10,
				totalPages: 0,
			});
		});

		it("should preserve arbitrary page and limit values", () => {
			const result = emptyPaginatedResult(5, 25);

			expect(result.page).toBe(5);
			expect(result.limit).toBe(25);
			expect(result.items).toHaveLength(0);
			expect(result.total).toBe(0);
			expect(result.totalPages).toBe(0);
		});

		it("should return a properly typed generic result", () => {
			const result = emptyPaginatedResult<{ id: string }>(1, 10);

			expect(result.items).toEqual([]);
		});
	});

	describe("mapPaginatedResult", () => {
		it("should transform items using the provided mapping function", () => {
			const input: PaginatedResult<number> = {
				items: [1, 2, 3],
				total: 3,
				page: 1,
				limit: 10,
				totalPages: 1,
			};

			const result = mapPaginatedResult(input, (items) =>
				items.map((n) => n * 2),
			);

			expect(result.items).toEqual([2, 4, 6]);
		});

		it("should preserve pagination metadata after mapping", () => {
			const input: PaginatedResult<string> = {
				items: ["a", "b"],
				total: 50,
				page: 3,
				limit: 20,
				totalPages: 3,
			};

			const result = mapPaginatedResult(input, (items) =>
				items.map((s) => s.toUpperCase()),
			);

			expect(result.total).toBe(50);
			expect(result.page).toBe(3);
			expect(result.limit).toBe(20);
			expect(result.totalPages).toBe(3);
		});

		it("should handle an empty items array", () => {
			const input: PaginatedResult<number> = {
				items: [],
				total: 0,
				page: 1,
				limit: 10,
				totalPages: 0,
			};

			const result = mapPaginatedResult(input, (items) =>
				items.map((n) => String(n)),
			);

			expect(result.items).toEqual([]);
			expect(result.total).toBe(0);
		});

		it("should support changing the item type", () => {
			const input: PaginatedResult<{ id: number; name: string }> = {
				items: [
					{ id: 1, name: "Alice" },
					{ id: 2, name: "Bob" },
				],
				total: 2,
				page: 1,
				limit: 10,
				totalPages: 1,
			};

			const result = mapPaginatedResult(input, (items) =>
				items.map((item) => item.name),
			);

			expect(result.items).toEqual(["Alice", "Bob"]);
		});
	});

	describe("buildPaginationMeta", () => {
		it("should calculate totalPages correctly", () => {
			const result = buildPaginationMeta(1, 10, 25);

			expect(result).toEqual({
				page: 1,
				limit: 10,
				totalCount: 25,
				totalPages: 3,
			});
		});

		it("should return totalPages of 1 when totalCount equals limit", () => {
			const result = buildPaginationMeta(1, 10, 10);

			expect(result.totalPages).toBe(1);
		});

		it("should return totalPages of 0 when totalCount is 0 and no minTotalPages", () => {
			const result = buildPaginationMeta(1, 10, 0);

			expect(result.totalPages).toBe(0);
		});

		it("should respect minTotalPages when calculated pages are lower", () => {
			const result = buildPaginationMeta(1, 10, 0, 1);

			expect(result.totalPages).toBe(1);
		});

		it("should use calculated pages when they exceed minTotalPages", () => {
			const result = buildPaginationMeta(1, 10, 50, 1);

			expect(result.totalPages).toBe(5);
		});

		it("should ceil partial pages", () => {
			const result = buildPaginationMeta(1, 10, 11);

			expect(result.totalPages).toBe(2);
		});

		it("should handle limit of 1", () => {
			const result = buildPaginationMeta(1, 1, 5);

			expect(result.totalPages).toBe(5);
		});

		it("should preserve page and limit in the output", () => {
			const result = buildPaginationMeta(3, 15, 100);

			expect(result.page).toBe(3);
			expect(result.limit).toBe(15);
			expect(result.totalCount).toBe(100);
		});
	});
});
