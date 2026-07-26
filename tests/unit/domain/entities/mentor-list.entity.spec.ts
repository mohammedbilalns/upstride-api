import { describe, expect, it } from "vitest";
import { MentorList } from "../../../../src/domain/entities/mentor-list.entity";

describe("MentorList Entity", () => {
	it("should enforce max lists per user", () => {
		expect(() => MentorList.assertCanCreate(20)).toThrow();
	});

	it("should allow creating lists within limit", () => {
		expect(() => MentorList.assertCanCreate(15)).not.toThrow();
	});

	it("should enforce max mentors per list", () => {
		expect(() => MentorList.assertCanAddMentor(150)).toThrow();
	});

	it("should allow adding mentors within limit", () => {
		expect(() => MentorList.assertCanAddMentor(100)).not.toThrow();
	});
});
