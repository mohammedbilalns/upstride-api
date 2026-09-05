import { describe, expect, it } from "vitest";
import { generatePreviewContent } from "../../../../../src/application/modules/article/utils/preview-content";

describe("preview-content", () => {
	describe("generatePreviewContent", () => {
		it("should return the original text when shorter than max length", () => {
			const result = generatePreviewContent("Hello world");

			expect(result).toBe("Hello world");
		});

		it("should strip HTML tags from content", () => {
			const result = generatePreviewContent(
				"<p>Hello <strong>world</strong></p>",
			);

			expect(result).toBe("Hello world");
		});

		it("should collapse multiple whitespace characters into a single space", () => {
			const result = generatePreviewContent("Hello    world    test");

			expect(result).toBe("Hello world test");
		});

		it("should trim leading and trailing whitespace", () => {
			const result = generatePreviewContent("   Hello world   ");

			expect(result).toBe("Hello world");
		});

		it("should truncate to default max length with ellipsis", () => {
			const longContent = "a".repeat(200);

			const result = generatePreviewContent(longContent);

			expect(result).toHaveLength(120);
			expect(result.endsWith("...")).toBe(true);
		});

		it("should truncate to a custom max length with ellipsis", () => {
			const content = "This is a long string that should be truncated";

			const result = generatePreviewContent(content, 20);

			expect(result.length).toBeLessThanOrEqual(20);
			expect(result.endsWith("...")).toBe(true);
		});

		it("should not add ellipsis when content is exactly max length", () => {
			const content = "a".repeat(120);

			const result = generatePreviewContent(content);

			expect(result).toBe(content);
			expect(result.endsWith("...")).toBe(false);
		});

		it("should handle empty strings", () => {
			const result = generatePreviewContent("");

			expect(result).toBe("");
		});

		it("should strip complex nested HTML", () => {
			const content =
				"<div><p>Paragraph one</p><ul><li>Item 1</li><li>Item 2</li></ul></div>";

			const result = generatePreviewContent(content);

			expect(result).not.toContain("<");
			expect(result).not.toContain(">");
			expect(result).toContain("Paragraph one");
			expect(result).toContain("Item 1");
		});

		it("should handle content that is only HTML tags", () => {
			const result = generatePreviewContent("<br /><hr /><div></div>");

			expect(result).toBe("");
		});

		it("should handle maxLength of 3 gracefully", () => {
			const result = generatePreviewContent("Hello world", 3);

			expect(result).toBe("...");
		});

		it("should handle maxLength less than 3", () => {
			const result = generatePreviewContent("Hello world", 2);

			// safeLength = Math.max(0, 2-3) = 0, so result is "..."
			// The ellipsis makes the string 3 chars, but maxLength was 2
			expect(result).toBe("...");
		});
	});
});
