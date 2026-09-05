import { describe, expect, it } from "vitest";
import { Mentor } from "../../../../src/domain/entities/mentor.entity";

describe("Mentor Entity", () => {
	it("should create mentor with valid score", () => {
		const now = new Date();
		const mentor = new Mentor(
			"mentor-1",
			"user-1",
			"Expert mentor",
			"role-1",
			"Tech Corp",
			10,
			85,
			"Gold",
			500,
			450,
			"https://example.com",
			"resume-1",
			["BS CS"],
			["English"],
			["Backend"],
			[{ skillId: "skill-1", level: "ADVANCED" }],
			[
				{
					company: "Tech",
					role: "Engineer",
					description: "desc",
					from: now,
					to: null,
				},
			],
			true,
			1,
			0,
			50,
			now,
			false,
			now,
			now,
		);

		expect(mentor.score).toBe(85);
		expect(mentor.isApproved).toBe(true);
	});

	it("should reject invalid score", () => {
		const now = new Date();
		expect(() => {
			new Mentor(
				"mentor-1",
				"user-1",
				"Bio",
				"role-1",
				"Company",
				5,
				150,
				null,
				null,
				null,
				null,
				"resume-1",
				[],
				[],
				[],
				[],
				[],
				false,
				0,
				0,
				0,
				null,
				false,
				now,
				now,
			);
		}).toThrow();
	});

	it("should enforce tier constraints", () => {
		const now = new Date();
		expect(() => {
			new Mentor(
				"mentor-1",
				"user-1",
				"Bio",
				"role-1",
				"Company",
				5,
				50,
				"Gold",
				null,
				null,
				null,
				"resume-1",
				[],
				[],
				[],
				[],
				[],
				false,
				0,
				0,
				0,
				null,
				false,
				now,
				now,
			);
		}).toThrow();
	});
});
