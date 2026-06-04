export const RESPONSE_MESSAGES = {
	AVAILABILITY: {
		CREATED: "Availability created successfully",
		UPDATED: "Availability updated successfully",
		DELETED: "Availability deleted successfully",
		RETRIEVED: "Mentor availabilities retrieved successfully",
		CONFLICT: "Availability conflict detected",
	},
	BOOKING: {
		SLOTS_COMPUTED: "Available slots computed successfully",
		CONFIRMED: "Booking confirmed successfully",
		CANCELLED: "Booking cancelled successfully",
		CANCELLED_BY_MENTOR: "Booking cancelled dynamically by mentor",
		PAYMENT_INITIATED: "Booking payment initiated.",
		BOOKING_RESCHEDULED: "Booking rescheduled successfully",
		FEEDBACK_UPDATED: "Feedback updated successfully",
	},
	DASHBOARD: {
		FETCHED_SUCCESS: "Dashboard fetched successfully",
		ACTIVITY_OVERVIEW_FETCHED_SUCCESS:
			"Dashboard activity overview fetched successfully",
	},
	ADMIN_DASHBOARD: {
		FETCHED_SUCCESS: "Admin dashboard fetched successfully",
		USER_GROWTH_FETCHED_SUCCESS:
			"Admin dashboard user growth fetched successfully",
		REVENUE_ANALYTICS_FETCHED_SUCCESS:
			"Admin dashboard revenue analytics fetched successfully",
		SESSION_OVERVIEW_FETCHED_SUCCESS:
			"Admin dashboard session overview fetched successfully",
	},
};

export const AuthResponseMessages = {
	LOGOUT_SUCCESS: "Logout successful",
	SESSION_REVOKED: "Session revoked successfully",
	ALL_OTHER_SESSIONS_REVOKED: "All other sessions revoked successfully",
	FETCH_SESSIONS_SUCCESS: "Active sessions fetched successfully",
	LOGIN_SUCCESS: "Login successful",
	REGISTER_SUCCESS:
		"An OTP has been sent to your email address,verify it to complete registration",
	OTP_SENT: "OTP sent successfully",
	OTP_VERIFIED: "OTP verified successfully",
	PASSWORD_RESET_SUCCESS: "Password reset successful",
	PASSWORD_CHANGED: "Password changed successfully",
	FETCH_USER_SUCCESS: "User information fetched successfully",
	OTP_RESENT: "OTP resent successfully",
	REFRESH_SESSION_SUCCESS: "Session refreshed successfully",
	RESET_OTP_SEND: "Password reset OTP sent successfully",
};

export const ProfileResponseMessages = {
	FETCH_PROFILE_SUCCESS: "Profile fetched successfully",
	UPDATE_PROFILE_SUCCESS: "Profile updated successfully",
	CHANGE_PASSWORD_SUCCESS: "Password changed successfully",
};

export const ArticleResponseMessages = {
	ARTICLE_NOT_FOUND: "Article not found",
	APPEAL_SUBMITTED_SUCCESS: "Appeal submitted successfully",
};

export const ReportResponseMessages = {
	REPORT_SUBMITTED_SUCCESS: "Report submitted successfully",
	REPORTS_FETCHED_SUCCESS: "Reports fetched successfully",
	REPORT_STATUS_UPDATED_SUCCESS: "Report status updated successfully",
	ARTICLE_BLOCKED_SUCCESS: "Article blocked successfully",
	ARTICLE_UNBLOCKED_SUCCESS: "Article unblocked successfully",
};

export const UsersResponseMessages = {
	USERS_FETCHED_SUCCESS: "Users fetched successfully",
	USER_BLOCKED_SUCCESS: "User blocked successfully",
	USER_UNBLOCKED_SUCCESS: "User unblocked successfully",
};

export const WalletResponseMessages = {
	COIN_BALANCE_FETCHED: "Coin balance fetched successfully",
	COIN_TRANSACTIONS_FETCHED: "Coin transactions fetched successfully",
	PAYMENT_TRANSACTIONS_FETCHED: "Payment transactions fetched successfully",
	PLATFORM_WALLET_FETCHED: "Platform wallet fetched successfully",
	PLATFORM_COIN_TRANSACTIONS_FETCHED:
		"Platform coin transactions fetched successfully",
	PLATFORM_PAYMENT_TRANSACTIONS_FETCHED:
		"Platform payment transactions fetched successfully",
};

export const MentorResponseMessages = {
	FETCH_APPLICATIONS_SUCCESS: "Mentor applications fetched successfully",
	FETCH_DISCOVERY_SUCCESS: "Mentors fetched successfully",
	APPROVE_APPLICATION_SUCCESS: "Mentor application approved successfully",
	REJECT_APPLICATION_SUCCESS: "Mentor application rejected successfully",
	FETCH_REGISTRATION_INFO_SUCCESS:
		"Mentor registration info fetched successfully",
	PROFILE_FETCHED_SUCCESS: "Mentor profile fetched successfully",
	PUBLIC_PROFILE_FETCHED_SUCCESS: "Public mentor profile fetched successfully",
	PROFILE_UPDATED_SUCCESS: "Mentor profile updated successfully",
	REGISTRATION_SUBMITTED_SUCCESS: "Mentor registration submitted successfully",
	REGISTRATION_RESUBMITTED_SUCCESS:
		"Mentor registration resubmitted successfully",
};

export const PaymentResponseMessages = {
	CHECKOUT_SESSION_CREATED: "Checkout session created successfully",
	MISSING_STRIPE_SIGNATURE: "Missing Stripe signature",
	INVALID_WEBHOOK_PAYLOAD: "Invalid webhook payload",
};

export const CatalogResponseMessages = {
	CATALOG_FETCHED_SUCCESS: "Catalog fetched successfully",
	INTEREST_ADDED_SUCCESS: "Interest added successfully",
	INTEREST_DISABLED_SUCCESS: "Interest disabled successfully",
	SKILL_ADDED_SUCCESS: "Skill added successfully",
	SKILL_DISABLED_SUCCESS: "Skill disabled successfully",
	PROFESSION_ADDED_SUCCESS: "Profession added successfully",
	PROFESSION_DISABLED_SUCCESS: "Profession disabled successfully",
	INTEREST_ENABLED_SUCCESS: "Interest enabled successfully",
	SKILL_ENABLED_SUCCESS: "Skill enabled successfully",
	PROFESSION_ENABLED_SUCCESS: "Profession enabled successfully",
	UPDATE_INTEREST_SUCCESS: "Interest updated successfully",
	UPDATE_SKILL_SUCCESS: "Skill updated successfully",
	UPDATE_PROFESSION_SUCCESS: "Profession updated successfully",
};

export const AdminsResponseMessages = {
	ADMINS_FETCHED_SUCCESS: "Admins fetched successfully",
	ADMIN_CREATED_SUCCESS: "Created admin successfully",
	ADMIN_BLOCKED_SUCCESS: "Admin blocked successfully",
	ADMIN_UNBLOCKED_SUCCESS: "Admin unblocked successfully",
};

export const FileResponseMessages = {
	PRESIGNED_URL_GENERATED: "Presigned URL generated successfully",
	DELETED: "File deleted successfully",
};

export const ReviewResponseMessages = {
	SUBMITTED_SUCCESS: "Review submitted successfully",
};
