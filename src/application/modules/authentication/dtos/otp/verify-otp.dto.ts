import type { LoginResponse } from "../login/login-with-email.dto";

interface VerifyResetOtpResponse {
	resetToken: string | null;
}

interface VerifyRegisterOtpResponse {
	setupToken: string;
}

interface VerifyChangePasswordOtpResponse {
	resetToken: string;
}

export type VerifyOtpResponse =
	| VerifyResetOtpResponse
	| VerifyRegisterOtpResponse
	| VerifyChangePasswordOtpResponse
	| LoginResponse;
