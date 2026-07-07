import { beforeEach, describe, expect, it } from "vitest";
import type { RequestPasswordResetInput } from "../../../../src/application/modules/authentication/dtos";
import { RequestPasswordResetUseCase } from "../../../../src/application/modules/authentication/use-cases/password-reset/request-password-reset.use-case";
import type { JobQueuePort } from "../../../../src/application/ports/job-queue.port";
import type { IOtpGenerator } from "../../../../src/application/services";
import type {
	IOtpRepository,
	IUserRepository,
} from "../../../../src/domain/repositories";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("RequestPasswordResetUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let otpRepository: ReturnType<typeof createMock<IOtpRepository>>;
	let otpGeneratorService: ReturnType<typeof createMock<IOtpGenerator>>;
	let jobQueue: ReturnType<typeof createMock<JobQueuePort>>;
	let useCase: RequestPasswordResetUseCase;

	const input: RequestPasswordResetInput = {
		email: "test@example.com",
	};

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		otpRepository = createMock<IOtpRepository>();
		otpGeneratorService = createMock<IOtpGenerator>();
		jobQueue = createMock<JobQueuePort>();

		useCase = new RequestPasswordResetUseCase(
			userRepository,
			otpRepository,
			otpGeneratorService,
			jobQueue,
		);
	});

	it("should return early when user does not exist", async () => {
		userRepository.findByEmail.mockResolvedValue(null);

		await useCase.execute(input);

		expect(userRepository.findByEmail).toHaveBeenCalledWith(input.email);
		expect(otpRepository.saveCode).not.toHaveBeenCalled();
		expect(jobQueue.enqueue).not.toHaveBeenCalled();
	});

	it("should return early when user authType is not LOCAL", async () => {
		const user = createUser({ email: input.email, authType: "GOOGLE" });
		userRepository.findByEmail.mockResolvedValue(user);

		await useCase.execute(input);

		expect(userRepository.findByEmail).toHaveBeenCalledWith(input.email);
		expect(otpRepository.saveCode).not.toHaveBeenCalled();
		expect(jobQueue.enqueue).not.toHaveBeenCalled();
	});

	it("should generate OTP, save code, and enqueue email for LOCAL user", async () => {
		const user = createUser({
			email: input.email,
			authType: "LOCAL",
			isBlocked: false,
			isVerified: true,
		});
		userRepository.findByEmail.mockResolvedValue(user);
		otpGeneratorService.generate.mockReturnValue("123456");

		await useCase.execute(input);

		expect(userRepository.findByEmail).toHaveBeenCalledWith(input.email);
		expect(otpGeneratorService.generate).toHaveBeenCalledWith(6);
		expect(otpRepository.saveCode).toHaveBeenCalledWith(
			user.id,
			"RESET_PASSWORD",
			"123456",
			180,
		);
		expect(jobQueue.enqueue).toHaveBeenCalledWith(
			"send-reset-password-otp-email",
			{
				to: input.email,
				otp: "123456",
			},
		);
	});

	it("should throw AuthenticationError when user is blocked", async () => {
		const user = createUser({
			email: input.email,
			authType: "LOCAL",
			isBlocked: true,
			isVerified: true,
		});
		userRepository.findByEmail.mockResolvedValue(user);

		await expect(useCase.execute(input)).rejects.toThrow(
			"You are blocked from the platform contact the admin",
		);
	});

	it("should throw AuthenticationError when user is not verified", async () => {
		const user = createUser({
			email: input.email,
			authType: "LOCAL",
			isBlocked: false,
			isVerified: false,
		});
		userRepository.findByEmail.mockResolvedValue(user);

		await expect(useCase.execute(input)).rejects.toThrow("Invalid Credentials");
	});
});
