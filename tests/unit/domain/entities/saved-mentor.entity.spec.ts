import { describe, expect, it } from "vitest";
import { SavedMentor } from "../../../../src/domain/entities/saved-mentor.entity";

describe("SavedMentor Entity", () => {
	describe("constructor", () => {
		it("should create a valid saved mentor", () => {
			const now = new Date();
			const saved = new SavedMentor(
				"saved-1",
				"user-1",
				"mentor-1",
				"list-1",
				now,
			);

			expect(saved.id).toBe("saved-1");
			expect(saved.userId).toBe("user-1");
			expect(saved.mentorId).toBe("mentor-1");
			expect(saved.listId).toBe("list-1");
			expect(saved.createdAt).toEqual(now);
		});

		it("should default createdAt to current date", () => {
			const before = new Date();
			const saved = new SavedMentor("saved-2", "user-2", "mentor-2", "list-2");
			const after = new Date();

			expect(saved.createdAt.getTime()).toBeGreaterThanOrEqual(
				before.getTime(),
			);
			expect(saved.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it("should track saved mentor relationships", () => {
			const now = new Date();
			const saved1 = new SavedMentor(
				"saved-1",
				"user-1",
				"mentor-1",
				"list-1",
				now,
			);
			const saved2 = new SavedMentor(
				"saved-2",
				"user-1",
				"mentor-2",
				"list-1",
				now,
			);
			const saved3 = new SavedMentor(
				"saved-3",
				"user-2",
				"mentor-1",
				"list-2",
				now,
			);

			expect(saved1.userId).toBe(saved2.userId);
			expect(saved1.mentorId).not.toBe(saved2.mentorId);
			expect(saved1.mentorId).toBe(saved3.mentorId);
		});

		it("should allow same mentor in different lists", () => {
			const now = new Date();
			const saved1 = new SavedMentor(
				"saved-1",
				"user-1",
				"mentor-1",
				"list-1",
				now,
			);
			const saved2 = new SavedMentor(
				"saved-2",
				"user-1",
				"mentor-1",
				"list-2",
				now,
			);

			expect(saved1.mentorId).toBe(saved2.mentorId);
			expect(saved1.listId).not.toBe(saved2.listId);
		});

		it("should allow multiple users to save same mentor", () => {
			const now = new Date();
			const saved1 = new SavedMentor(
				"saved-1",
				"user-1",
				"mentor-1",
				"list-1",
				now,
			);
			const saved2 = new SavedMentor(
				"saved-2",
				"user-2",
				"mentor-1",
				"list-1",
				now,
			);

			expect(saved1.mentorId).toBe(saved2.mentorId);
			expect(saved1.userId).not.toBe(saved2.userId);
		});
	});
});
