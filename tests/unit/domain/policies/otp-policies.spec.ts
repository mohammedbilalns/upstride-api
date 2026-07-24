import { describe, expect, it } from "vitest";
import { ChangePasswordOtpPolicy } from "../../../../src/domain/policies/change-password-otp.policy";
import { OtpPurpose } from "../../../../src/domain/policies/otp-purposes";
import { RegisterOtpPolicy } from "../../../../src/domain/policies/register-otp.policy";
import { ResetPasswordOtpPolicy } from "../../../../src/domain/policies/reset-password-otp.policy";

describe("OTP Policies", () => {
	describe("RegisterOtpPolicy", () => {
		it("should have correct policy settings", () => {
			const policy = new RegisterOtpPolicy();

			expect(policy.purpose).toBe(OtpPurpose.REGISTER);
			expect(policy.ttl).toBe(5 * 60); // 5 minutes
			expect(policy.maxAttempts).toBe(5);
			expect(policy.maxResends).toBe(3);
		});

		it("should have TTL of 300 seconds", () => {
			const policy = new RegisterOtpPolicy();
			expect(policy.ttl).toBe(300);
		});

		it("should allow 5 verification attempts", () => {
			const policy = new RegisterOtpPolicy();
			expect(policy.maxAttempts).toBe(5);
		});

		it("should allow 3 resend attempts", () => {
			const policy = new RegisterOtpPolicy();
			expect(policy.maxResends).toBe(3);
		});
	});

	describe("ResetPasswordOtpPolicy", () => {
		it("should have correct policy settings", () => {
			const policy = new ResetPasswordOtpPolicy();

			expect(policy.purpose).toBe(OtpPurpose.RESET_PASSWORD);
			expect(policy.ttl).toBe(3 * 60); // 3 minutes
			expect(policy.maxAttempts).toBe(3);
			expect(policy.maxResends).toBe(3);
		});

		it("should have shorter TTL than RegisterOtpPolicy", () => {
			const registerPolicy = new RegisterOtpPolicy();
			const resetPolicy = new ResetPasswordOtpPolicy();

			expect(resetPolicy.ttl).toBeLessThan(registerPolicy.ttl);
			expect(resetPolicy.ttl).toBe(180); // 3 minutes
		});

		it("should have stricter max attempts", () => {
			const registerPolicy = new RegisterOtpPolicy();
			const resetPolicy = new ResetPasswordOtpPolicy();

			expect(resetPolicy.maxAttempts).toBeLessThan(registerPolicy.maxAttempts);
			expect(resetPolicy.maxAttempts).toBe(3);
		});
	});

	describe("ChangePasswordOtpPolicy", () => {
		it("should have correct policy settings", () => {
			const policy = new ChangePasswordOtpPolicy();

			expect(policy.purpose).toBe(OtpPurpose.CHANGE_PASSWORD);
			expect(policy.ttl).toBe(5 * 60); // 5 minutes
			expect(policy.maxAttempts).toBe(3);
			expect(policy.maxResends).toBe(3);
		});

		it("should have same TTL as RegisterOtpPolicy", () => {
			const registerPolicy = new RegisterOtpPolicy();
			const changePolicy = new ChangePasswordOtpPolicy();

			expect(changePolicy.ttl).toBe(registerPolicy.ttl);
		});

		it("should have stricter max attempts than RegisterOtpPolicy", () => {
			const registerPolicy = new RegisterOtpPolicy();
			const changePolicy = new ChangePasswordOtpPolicy();

			expect(changePolicy.maxAttempts).toBeLessThan(registerPolicy.maxAttempts);
		});
	});

	describe("Policy comparison", () => {
		it("should have different purposes", () => {
			const registerPolicy = new RegisterOtpPolicy();
			const resetPolicy = new ResetPasswordOtpPolicy();
			const changePolicy = new ChangePasswordOtpPolicy();

			expect(registerPolicy.purpose).not.toBe(resetPolicy.purpose);
			expect(resetPolicy.purpose).not.toBe(changePolicy.purpose);
			expect(registerPolicy.purpose).not.toBe(changePolicy.purpose);
		});

		it("should enforce different security levels", () => {
			const registerPolicy = new RegisterOtpPolicy();
			const resetPolicy = new ResetPasswordOtpPolicy();

			// Reset password OTP is more secure (shorter TTL, fewer attempts)
			expect(resetPolicy.ttl).toBeLessThan(registerPolicy.ttl);
			expect(resetPolicy.maxAttempts).toBeLessThan(registerPolicy.maxAttempts);
		});

		it("should all allow same number of resends", () => {
			const registerPolicy = new RegisterOtpPolicy();
			const resetPolicy = new ResetPasswordOtpPolicy();
			const changePolicy = new ChangePasswordOtpPolicy();

			expect(registerPolicy.maxResends).toBe(3);
			expect(resetPolicy.maxResends).toBe(3);
			expect(changePolicy.maxResends).toBe(3);
		});
	});
});
