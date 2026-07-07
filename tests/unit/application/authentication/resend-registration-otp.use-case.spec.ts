import { beforeEach, describe, expect, it } from "vitest";
import type { ResendRegistrationOtpInput } from "../../../../src/application/modules/authentication/dtos/otp/resend-registration-otp.dto";
import { MaxResendsExceededError } from "../../../../src/application/modules/authentication/errors";
import { ResendRegistrationOtpUseCase } from "../../../../src/application/modules/authentication/use-cases/registration/resend-registration-otp.use-case";
import type { JobQueuePort } from "../../../../src/application/modules/ports/job-queue.port";
import type { IOtpGenerator } from "../../../../src/application/services";
import { UserNotFoundError } from "../../../../src/application/shared/errors/user-not-found.error";
import type {
	IOtpRepository,
	IUserRepository,
} from "../../../../src/domain/repositories";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("ResendRegistrationOtpUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let otpRepository: ReturnType<typeof createMock<IOtpRepository>>;
	let otpGeneratorService: ReturnType<typeof createMock<IOtpGenerator>>;
	let jobQueue: ReturnType<typeof createMock<JobQueuePort>>;
	let useCase: ResendRegistrationOtpUseCase;

	const input: ResendRegistrationOtpInput = {
		email: "new@example.com",
	};

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		otpRepository = createMock<IOtpRepository>();
		otpGeneratorService = createMock<IOtpGenerator>();
		jobQueue = createMock<JobQueuePort>();

		useCase = new ResendRegistrationOtpUseCase(
			userRepository,
			otpRepository,
			otpGeneratorService,
			jobQueue,
		);
	});

	it("should throw UserNotFoundError when the email does not exist", async () => {
		userRepository.findByEmail.mockResolvedValue(null);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);

		expect(otpRepository.incrementResends).not.toHaveBeenCalled();
	});

	it("should throw MaxResendsExceededError when resend limit is exceeded", async () => {
		userRepository.findByEmail.mockResolvedValue(
			createUser({ email: input.email }),
		);
		otpRepository.incrementResends.mockResolvedValue(4);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			MaxResendsExceededError,
		);

		expect(otpRepository.resetAttempts).not.toHaveBeenCalled();
		expect(otpRepository.saveCode).not.toHaveBeenCalled();
		expect(jobQueue.enqueue).not.toHaveBeenCalled();
	});

	it("should resend the registration otp and reset attempts", async () => {
		const user = createUser({ id: "user-1", email: input.email });

		userRepository.findByEmail.mockResolvedValue(user);
		otpRepository.incrementResends.mockResolvedValue(1);
		otpGeneratorService.generate.mockReturnValue("123456");

		await useCase.execute(input);

		expect(otpRepository.incrementResends).toHaveBeenCalledWith(
			user.id,
			"REGISTER",
			300,
		);
		expect(otpRepository.resetAttempts).toHaveBeenCalledWith(
			user.id,
			"REGISTER",
		);
		expect(otpRepository.saveCode).toHaveBeenCalledWith(
			user.id,
			"REGISTER",
			"123456",
			300,
		);
		expect(jobQueue.enqueue).toHaveBeenCalledWith("send-register-otp-email", {
			to: user.email,
			name: user.name,
			otp: "123456",
		});
	});
});
