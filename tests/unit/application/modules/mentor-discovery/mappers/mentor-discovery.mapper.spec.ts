import { describe, expect, it } from "vitest";
import { MentorDiscoveryMapper } from "../../../../../../src/application/modules/mentor-discovery/mappers/mentor-discovery.mapper";
import type { MentorDiscoveryDetails } from "../../../../../../src/domain/repositories/mentor.repository.types";

describe("MentorDiscoveryMapper", () => {
	describe("toDto", () => {
		it("should map mentor data to DTO", () => {
			const data = {
				id: "mentor-1",
				userId: "user-1",
				isUserBlocked: false,
				user: {
					name: "John Doe",
					profilePictureId: "avatar.jpg",
				},
				currentRoleDetails: {
					name: "Senior Engineer",
				},
				bio: "Hello",
				yearsOfExperience: 5,
				avgRating: 4.5,
				tierName: "Gold",
				languages: ["English"],
				areasOfExpertise: ["cat-1"],
				currentRoleId: "role-1",
				organization: "Tech Corp",
				score: 90,
				tierMax30minPayment: 500,
				currentPricePer30Min: 400,
				personalWebsite: null,
				resumeId: "resume-1",
				educationalQualifications: [],
				toolsAndSkills: [],
				experience: [],
				isApproved: true,
				applicationAttempts: 1,
				skippedSessionsCount: 0,
				totalSessions: 10,
				lastSessionAt: null,
				isRejected: false,
				updatedAt: new Date(),
				rejectionReason: null,
				categories: [],
				skills: [],
				createdAt: new Date(),
			} as MentorDiscoveryDetails;

			const result = MentorDiscoveryMapper.toDto(data);

			expect(result.id).toBe("mentor-1");
			expect(result.name).toBe("John Doe");
			expect(result.designation).toBe("Senior Engineer");
		});

		it("should handle missing optional fields", () => {
			const data = {
				id: "mentor-2",
				userId: "user-2",
				user: {
					name: "Jane Smith",
					profilePictureId: null,
				},
				currentRoleDetails: null,
			} as unknown as MentorDiscoveryDetails;

			const result = MentorDiscoveryMapper.toDto(data);

			expect(result.designation).toBeUndefined();
			expect(result.avatar).toBeNull();
		});
	});

	describe("toDtos", () => {
		it("should map array of mentors", () => {
			const mentors = [
				{
					id: "mentor-1",
					user: { name: "M1" },
				},
				{
					id: "mentor-2",
					user: { name: "M2" },
				},
			] as unknown as MentorDiscoveryDetails[];

			const result = MentorDiscoveryMapper.toDtos(mentors);

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe("mentor-1");
			expect(result[1].id).toBe("mentor-2");
		});
	});
});
