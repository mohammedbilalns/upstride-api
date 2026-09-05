import type { Container } from "inversify";
import { AuthSessionService } from "../../application/modules/authentication/services";
import {
	GetActiveSessionsUseCase,
	GetMeUseCase,
	LoginWithEmailUseCase,
	LogoutUseCase,
	RefreshSessionUseCase,
	RegisterWithEmailUseCase,
	RequestPasswordResetUseCase,
	ResendRegistrationOtpUseCase,
	ResendResetPasswordOtpUseCase,
	RevokeAllOtherSessionsUseCase,
	RevokeSessionUseCase,
	SaveUserInterestsUseCase,
	SocialLoginUseCase,
	UpdatePasswordUseCase,
	VerifyChangePasswordOtpUseCase,
	VerifyRegistrationOtpUseCase,
	VerifyResetPasswordOtpUseCase,
} from "../../application/modules/authentication/use-cases";
import { DummyLoginUseCase } from "../../application/modules/authentication/use-cases/login/dummy-login.use-case";
import { TYPES } from "../../shared/types/types";

export const registerAuthenticationBindings = (container: Container): void => {
	//Services
	container.bind(TYPES.Services.AuthSession).to(AuthSessionService);

	//UseCases
	container
		.bind(TYPES.UseCases.LoginWithEmail)
		.to(LoginWithEmailUseCase)
		.inSingletonScope();
	container
		.bind(TYPES.UseCases.SocialLogin)
		.to(SocialLoginUseCase)
		.inSingletonScope();
	container
		.bind(TYPES.UseCases.RegisterWithEmail)
		.to(RegisterWithEmailUseCase)
		.inSingletonScope();
	container
		.bind(TYPES.UseCases.RequestPasswordReset)
		.to(RequestPasswordResetUseCase)
		.inSingletonScope();
	container
		.bind(TYPES.UseCases.UpdatePassword)
		.to(UpdatePasswordUseCase)
		.inSingletonScope();
	container
		.bind(TYPES.UseCases.VerifyRegistrationOtp)
		.to(VerifyRegistrationOtpUseCase)
		.inSingletonScope();
	container
		.bind(TYPES.UseCases.VerifyResetPasswordOtp)
		.to(VerifyResetPasswordOtpUseCase)
		.inSingletonScope();
	container
		.bind(TYPES.UseCases.VerifyChangePasswordOtp)
		.to(VerifyChangePasswordOtpUseCase)
		.inSingletonScope();
	container
		.bind(TYPES.UseCases.ResendRegistrationOtp)
		.to(ResendRegistrationOtpUseCase)
		.inSingletonScope();
	container
		.bind(TYPES.UseCases.ResendResetPasswordOtp)
		.to(ResendResetPasswordOtpUseCase)
		.inSingletonScope();
	container
		.bind(TYPES.UseCases.RefreshSession)
		.to(RefreshSessionUseCase)
		.inSingletonScope();
	container.bind(TYPES.UseCases.Logout).to(LogoutUseCase).inSingletonScope();
	container
		.bind(TYPES.UseCases.RevokeSession)
		.to(RevokeSessionUseCase)
		.inSingletonScope();
	container
		.bind(TYPES.UseCases.RevokeAllOtherSessions)
		.to(RevokeAllOtherSessionsUseCase)
		.inSingletonScope();
	container
		.bind(TYPES.UseCases.SaveUserInterests)
		.to(SaveUserInterestsUseCase)
		.inSingletonScope();
	container.bind(TYPES.UseCases.GetMe).to(GetMeUseCase).inSingletonScope();
	container
		.bind(TYPES.UseCases.GetActiveSessions)
		.to(GetActiveSessionsUseCase)
		.inSingletonScope();
	container
		.bind(TYPES.UseCases.DummyLogin)
		.to(DummyLoginUseCase)
		.inSingletonScope();
};
