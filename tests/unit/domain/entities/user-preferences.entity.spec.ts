import { describe, expect, it } from "vitest";
import { UserPreferences } from "../../../../src/domain/entities/user-preferences.entity";

describe("UserPreferences Entity", () => {
	it("should create valid preferences", () => {
		const prefs = UserPreferences.create(
			["int-1", "int-2"],
			["skill-1", "skill-2"],
		);

		expect(prefs.interests).toHaveLength(2);
		expect(prefs.skills).toHaveLength(2);
	});

	it("should throw with too few interests", () => {
		expect(() => {
			UserPreferences.create(["int-1"], ["skill-1", "skill-2"]);
		}).toThrow();
	});

	it("should throw with too many interests", () => {
		expect(() => {
			UserPreferences.create(
				["int-1", "int-2", "int-3", "int-4", "int-5", "int-6"],
				["skill-1", "skill-2"],
			);
		}).toThrow();
	});

	it("should convert to raw format", () => {
		const prefs = UserPreferences.create(
			["int-1", "int-2"],
			["skill-1", "skill-2"],
		);

		const raw = prefs.toRaw();

		expect(raw.interests).toEqual(["int-1", "int-2"]);
		expect(raw.skills).toEqual([
			{ skillId: "skill-1" },
			{ skillId: "skill-2" },
		]);
	});
});
