import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	fetchWithDiagnosticsMock,
	sendMailMock,
	stripeCreateSessionMock,
	s3SendMock,
	getSignedUrlMock,
	createPresignedPostMock,
} = vi.hoisted(() => ({
	fetchWithDiagnosticsMock: vi.fn(),
	sendMailMock: vi.fn(),
	stripeCreateSessionMock: vi.fn(),
	s3SendMock: vi.fn(),
	getSignedUrlMock: vi.fn(),
	createPresignedPostMock: vi.fn(),
}));

vi.mock("../../../../src/shared/utilities/outbound-fetch.util", () => ({
	fetchWithDiagnostics: fetchWithDiagnosticsMock,
}));

vi.mock("../../../../src/infrastructure/mail/nodemailer.transport", () => ({
	mailTransporter: {
		sendMail: sendMailMock,
	},
}));

vi.mock("@aws-sdk/client-s3", () => ({
	S3Client: class {
		send = s3SendMock;
	},
	DeleteObjectCommand: class {
		input: unknown;
		constructor(input: unknown) {
			this.input = input;
		}
	},
	GetObjectCommand: class {
		input: unknown;
		constructor(input: unknown) {
			this.input = input;
		}
	},
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
	getSignedUrl: getSignedUrlMock,
}));

vi.mock("@aws-sdk/s3-presigned-post", () => ({
	createPresignedPost: createPresignedPostMock,
}));

vi.mock("stripe", () => ({
	default: class Stripe {
		checkout = {
			sessions: {
				create: stripeCreateSessionMock,
			},
		};
	},
}));

import {
	AuthenticationError,
	OAuthProviderError,
} from "../../../../src/application/modules/authentication/errors";
import { GoogleOAuthService } from "../../../../src/infrastructure/services/google-oauth.service";
import { LinkedInOAuthService } from "../../../../src/infrastructure/services/linkedin-oauth.service";
import { MailService } from "../../../../src/infrastructure/services/mail.service";
import { S3StorageService } from "../../../../src/infrastructure/services/s3-storage.service";
import { StripePaymentService } from "../../../../src/infrastructure/services/stripe-payment.service";

describe("external infrastructure services", () => {
	beforeEach(() => {
		fetchWithDiagnosticsMock.mockReset();
		sendMailMock.mockReset();
		stripeCreateSessionMock.mockReset();
		s3SendMock.mockReset();
		getSignedUrlMock.mockReset();
		createPresignedPostMock.mockReset();
	});

	it("exchanges a Google auth code for social identity", async () => {
		const service = new GoogleOAuthService();
		fetchWithDiagnosticsMock
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ access_token: "google-token" }), {
					status: 200,
				}),
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						sub: "google-user-1",
						email: "user@example.com",
						email_verified: true,
						name: "Google User",
					}),
					{ status: 200 },
				),
			);

		await expect(service.getIdentity("auth-code")).resolves.toEqual({
			email: "user@example.com",
			name: "Google User",
			providerUserId: "google-user-1",
			authType: "GOOGLE",
			isVerified: true,
		});
	});

	it("surfaces Google provider failures", async () => {
		const service = new GoogleOAuthService();
		fetchWithDiagnosticsMock.mockRejectedValueOnce(new Error("network"));

		await expect(service.getIdentity("auth-code")).rejects.toBeInstanceOf(
			OAuthProviderError,
		);
	});

	it("exchanges a LinkedIn auth code for social identity and validates credential format", async () => {
		const service = new LinkedInOAuthService();
		fetchWithDiagnosticsMock
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ access_token: "linkedin-token" }), {
					status: 200,
				}),
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						sub: "linkedin-user-1",
						email: "pro@example.com",
						given_name: "Lin",
						family_name: "KedIn",
					}),
					{ status: 200 },
				),
			);

		await expect(
			service.getIdentity("auth-code::http://localhost:5173/linkedin"),
		).resolves.toEqual({
			email: "pro@example.com",
			name: "Lin KedIn",
			providerUserId: "linkedin-user-1",
			authType: "LINKEDIN",
			isVerified: true,
		});

		await expect(service.getIdentity("bad-credential")).rejects.toBeInstanceOf(
			AuthenticationError,
		);
	});

	it("sends mail through the configured transporter", async () => {
		const service = new MailService();
		sendMailMock.mockResolvedValue(undefined);

		await service.send({
			to: "user@example.com",
			subject: "Hello",
			html: "<b>Hello</b>",
			text: "Hello",
		});

		expect(sendMailMock).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "user@example.com",
				subject: "Hello",
			}),
		);
	});

	it("rethrows mail transport failures", async () => {
		const service = new MailService();
		sendMailMock.mockRejectedValue(new Error("smtp failed"));

		await expect(
			service.send({
				to: "user@example.com",
				subject: "Hello",
				html: "<b>Hello</b>",
				text: "Hello",
			}),
		).rejects.toThrow("smtp failed");
	});

	it("wraps S3 operations and public URLs", async () => {
		const service = new S3StorageService();
		getSignedUrlMock.mockResolvedValue("https://signed.example.com/file");
		createPresignedPostMock.mockResolvedValue({
			url: "https://upload.example.com",
			fields: { key: "docs/report.pdf" },
		});

		await service.delete("docs/report.pdf");
		await expect(service.getSignedUrl("docs/report.pdf")).resolves.toBe(
			"https://signed.example.com/file",
		);
		expect(service.getPublicUrl("docs/report 1.pdf")).toBe(
			"https://test-bucket.s3.ap-south-1.amazonaws.com/docs/report%201.pdf",
		);
		await expect(
			service.getPresignedPost("docs/report.pdf", "application/pdf"),
		).resolves.toEqual({
			url: "https://upload.example.com",
			fields: { key: "docs/report.pdf" },
		});
		expect(s3SendMock).toHaveBeenCalledTimes(1);
	});

	it("creates stripe checkout sessions for bookings and coin topups", async () => {
		const service = new StripePaymentService();
		stripeCreateSessionMock.mockResolvedValue({
			id: "cs_test_1",
			url: "https://checkout.stripe.com/cs_test_1",
		});

		await expect(
			service.createCheckoutSession({
				userId: "user-1",
				amount: 2000,
				currency: "inr",
				successUrl: "http://localhost:5173/success",
				cancelUrl: "http://localhost:5173/cancel",
				coins: 100,
				metadata: { type: "BOOKING_PAYMENT", bookingId: "booking-1" },
			}),
		).resolves.toEqual({
			id: "cs_test_1",
			url: "https://checkout.stripe.com/cs_test_1",
		});

		expect(stripeCreateSessionMock).toHaveBeenCalledWith(
			expect.objectContaining({
				metadata: { type: "BOOKING_PAYMENT", bookingId: "booking-1" },
			}),
		);
	});
});
