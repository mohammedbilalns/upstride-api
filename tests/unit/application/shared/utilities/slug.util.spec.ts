import { describe, expect, it } from "vitest";
import { createUniqueSlug } from "../../../../../src/application/shared/utilities/slug.util";

describe("slug.util", () => {
	describe("createUniqueSlug", () => {
		it("should return a basic slug when it is unique on the first try", async () => {
			const isUnique = async () => true;

			const slug = await createUniqueSlug("Hello World", isUnique);

			expect(slug).toBe("hello-world");
		});

		it("should slugify with lowercase and strict mode", async () => {
			const isUnique = async () => true;

			const slug = await createUniqueSlug("  My Article Title!  ", isUnique);

			expect(slug).toBe("my-article-title");
		});

		it("should append a counter when the base slug is not unique", async () => {
			let callCount = 0;
			const isUnique = async () => {
				callCount++;
				return callCount > 1;
			};

			const slug = await createUniqueSlug("test", isUnique);

			expect(slug).toBe("test-1");
		});

		it("should increment the counter until a unique slug is found", async () => {
			let callCount = 0;
			const isUnique = async () => {
				callCount++;
				return callCount > 3;
			};

			const slug = await createUniqueSlug("post", isUnique);

			expect(slug).toBe("post-3");
		});

		it("should handle special characters by stripping them", async () => {
			const isUnique = async () => true;

			const slug = await createUniqueSlug("Hello & Goodbye @ World!", isUnique);

			expect(slug).toBe("hello-and-goodbye-world");
		});

		it("should handle names with multiple spaces", async () => {
			const isUnique = async () => true;

			const slug = await createUniqueSlug("too   many   spaces", isUnique);

			expect(slug).toBe("too-many-spaces");
		});
	});
});
