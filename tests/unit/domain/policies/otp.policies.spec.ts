import { describe, expect, it } from "vitest";
import { ChangePasswordOtpPolicy } from "../../../../src/domain/policies/change-password-otp.policy";
import { OtpPurpose } from "../../../../src/domain/policies/otp-purposes";
import { RegisterOtpPolicy } from "../../../../src/domain/policies/register-otp.policy";
import { ResetPasswordOtpPolicy } from "../../../../src/domain/policies/reset-password-otp.policy";

describe("OTP Policies", () => {
	describe("RegisterOtpPolicy", () => {
		it("should have correct config", () => {
			const policy = new RegisterOtpPolicy();
			expect(policy.purpose).toBe(OtpPurpose.REGISTER);
			expect(policy.ttl).toBe(300);
			expect(policy.maxAttempts).toBe(5);
			expect(policy.maxResends).toBe(3);
		});
	});

	describe("ResetPasswordOtpPolicy", () => {
		it("should have correct config", () => {
			const policy = new ResetPasswordOtpPolicy();
			expect(policy.purpose).toBe(OtpPurpose.RESET_PASSWORD);
			expect(policy.ttl).toBe(180);
			expect(policy.maxAttempts).toBe(3);
			expect(policy.maxResends).toBe(3);
		});
	});

	describe("ChangePasswordOtpPolicy", () => {
		it("should have correct config", () => {
			const policy = new ChangePasswordOtpPolicy();
			expect(policy.purpose).toBe(OtpPurpose.CHANGE_PASSWORD);
			expect(policy.ttl).toBe(300);
			expect(policy.maxAttempts).toBe(3);
			expect(policy.maxResends).toBe(3);
		});
	});

	describe("policy constraints", () => {
		it("should have reasonable TTL", () => {
			const policies = [
				new RegisterOtpPolicy(),
				new ResetPasswordOtpPolicy(),
				new ChangePasswordOtpPolicy(),
			];

			policies.forEach((policy) => {
				expect(policy.ttl).toBeGreaterThan(0);
				expect(policy.ttl).toBeLessThan(1000);
			});
		});

		it("should have valid attempt counts", () => {
			const policies = [
				new RegisterOtpPolicy(),
				new ResetPasswordOtpPolicy(),
				new ChangePasswordOtpPolicy(),
			];

			policies.forEach((policy) => {
				expect(policy.maxAttempts).toBeGreaterThan(0);
				expect(policy.maxResends).toBeGreaterThan(0);
				expect(policy.maxAttempts).toBeGreaterThanOrEqual(policy.maxResends);
			});
		});
	});
});
