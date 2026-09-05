import { Router } from "express";
import { apiContainer } from "../../../main/di/api.container";
import { ROUTES } from "../constants";
import {
	AuthController,
	LogoutController,
	PasswordResetController,
} from "../controllers";
import {
	csrfProtection,
	ensureCsrfSessionId,
	validate,
	verifySession,
} from "../middlewares";
import {
	GoogleLoginBodySchema,
	LinkedInLoginBodySchema,
	LoginBodySchema,
	PasswordResetBodySchema,
	RegisterBodySchema,
	ResendOtpBodySchema,
	SaveInterestsBodySchema,
	UpdatePasswordBodySchema,
	VerifyOtpBodySchema,
} from "../validators/auth";
import { RevokeSessionBodySchema } from "../validators/auth/revocation.validator";

const router = Router();
const authController = apiContainer.get(AuthController);
const passwordResetController = apiContainer.get(PasswordResetController);
const logoutController = apiContainer.get(LogoutController);

router.post(
	ROUTES.AUTH.LOGIN,
	ensureCsrfSessionId,
	validate({ body: LoginBodySchema }),
	authController.login,
);

router.post(ROUTES.AUTH.DUMMY_LOGIN, authController.dummyLogin);

router.post(
	ROUTES.AUTH.GOOGLE,
	ensureCsrfSessionId,
	validate({ body: GoogleLoginBodySchema }),
	authController.loginWithGoogle,
);

router.post(
	ROUTES.AUTH.LINKEDIN,
	ensureCsrfSessionId,
	validate({ body: LinkedInLoginBodySchema }),
	authController.loginWithLinkedIn,
);

router.post(
	ROUTES.AUTH.REGISTER,
	validate({ body: RegisterBodySchema }),
	authController.register,
);

router.post(
	ROUTES.AUTH.VERIFY_REGISTER_OTP,
	validate({ body: VerifyOtpBodySchema }),
	authController.verifyRegisterOtp,
);

router.post(
	ROUTES.AUTH.RESEND_REGISTER_OTP,
	validate({ body: ResendOtpBodySchema }),
	authController.resendRegisterOtp,
);

router.get(ROUTES.AUTH.CSRF, ensureCsrfSessionId, authController.getCsrfToken);

router.post(ROUTES.AUTH.REFRESH, csrfProtection, authController.refreshSession);

router.post(
	ROUTES.AUTH.SAVE_INTERESTS,
	ensureCsrfSessionId,
	validate({ body: SaveInterestsBodySchema }),
	authController.saveInterests,
);

router.post(
	ROUTES.AUTH.REQUEST_PASSWORD_RESET,
	validate({ body: PasswordResetBodySchema }),
	passwordResetController.requestPasswordReset,
);

router.post(
	ROUTES.AUTH.VERIFY_RESET_PASSWORD_OTP,
	validate({ body: VerifyOtpBodySchema }),
	passwordResetController.verifyResetPasswordOtp,
);

router.post(
	ROUTES.AUTH.RESEND_RESET_PASSWORD_OTP,
	validate({ body: ResendOtpBodySchema }),
	passwordResetController.resendResetPasswordOtp,
);

router.post(
	ROUTES.AUTH.UPDATE_PASSWORD,
	validate({ body: UpdatePasswordBodySchema }),
	passwordResetController.updatePassword,
);

router.use(verifySession);

router.get(ROUTES.AUTH.ACTIVE_SESSIONS, logoutController.getActiveSessions);

router.post(ROUTES.AUTH.LOGOUT, logoutController.logout);

router.post(
	ROUTES.AUTH.REVOKE_SESSION,
	validate({ body: RevokeSessionBodySchema }),
	logoutController.revokeSession,
);

router.post(
	ROUTES.AUTH.REVOKE_ALL_OTHER_SESSIONS,
	logoutController.revokeAllOtherSessions,
);
export { router as authRouter };
