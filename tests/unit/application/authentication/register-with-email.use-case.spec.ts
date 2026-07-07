import { beforeEach, describe, expect, it } from "vitest";
import type { RegisterWithEmailInput } from "../../../../src/application/modules/authentication/dtos";
import { UserAlreadyExistsError } from "../../../../src/application/modules/authentication/errors";
import { RegisterWithEmailUseCase } from "../../../../src/application/modules/authentication/use-cases/registration/register-with-email.use-case";
import type { JobQueuePort } from "../../../../src/application/ports/job-queue.port";
import type {
	IOtpGenerator,
	IPasswordService,
} from "../../../../src/application/services";
import type {
	IOtpRepository,
	IUserRepository,
} from "../../../../src/domain/repositories";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("RegisterWithEmailUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let otpRepository: ReturnType<typeof createMock<IOtpRepository>>;
	let passwordService: ReturnType<typeof createMock<IPasswordService>>;
	let otpGeneratorService: ReturnType<typeof createMock<IOtpGenerator>>;
	let jobQueue: ReturnType<typeof createMock<JobQueuePort>>;
	let useCase: RegisterWithEmailUseCase;

	const input: RegisterWithEmailInput = {
		name: "New User",
		email: "new@example.com",
		phone: "9999999999",
		password: "password123",
	};

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		otpRepository = createMock<IOtpRepository>();
		passwordService = createMock<IPasswordService>();
		otpGeneratorService = createMock<IOtpGenerator>();
		jobQueue = createMock<JobQueuePort>();

		useCase = new RegisterWithEmailUseCase(
			userRepository,
			otpRepository,
			passwordService,
			otpGeneratorService,
			jobQueue,
		);
	});

	it("should throw UserAlreadyExistsError when the email is already verified", async () => {
		userRepository.findByEmail.mockResolvedValue(
			createUser({ isVerified: true }),
		);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UserAlreadyExistsError,
		);

		expect(passwordService.hashPassword).not.toHaveBeenCalled();
		expect(userRepository.create).not.toHaveBeenCalled();
	});

	it("should delete an unverified user before creating a new one", async () => {
		const existingUser = createUser({
			id: "existing-user",
			email: input.email,
			isVerified: false,
		});
		const createdUser = createUser({
			id: "created-user",
			name: input.name,
			email: input.email,
			phone: input.phone,
			isVerified: false,
		});

		userRepository.findByEmail.mockResolvedValue(existingUser);
		passwordService.hashPassword.mockResolvedValue("hashed-password");
		userRepository.create.mockResolvedValue(createdUser);
		otpGeneratorService.generate.mockReturnValue("123456");

		await useCase.execute(input);

		expect(userRepository.deleteById).toHaveBeenCalledWith(existingUser.id);
		expect(passwordService.hashPassword).toHaveBeenCalledWith(input.password);
		expect(userRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				name: input.name,
				email: input.email,
				phone: input.phone,
				passwordHash: "hashed-password",
				authType: "LOCAL",
				role: "USER",
				isBlocked: false,
				isVerified: false,
			}),
		);
		expect(otpRepository.saveCode).toHaveBeenCalledWith(
			createdUser.id,
			"REGISTER",
			"123456",
			300,
		);
		expect(jobQueue.enqueue).toHaveBeenCalledWith("send-register-otp-email", {
			to: createdUser.email,
			name: createdUser.name,
			otp: "123456",
		});
	});

	it("should create a new user and send a registration otp", async () => {
		const createdUser = createUser({
			id: "created-user",
			name: input.name,
			email: input.email,
			phone: input.phone,
			isVerified: false,
		});

		userRepository.findByEmail.mockResolvedValue(null);
		passwordService.hashPassword.mockResolvedValue("hashed-password");
		userRepository.create.mockResolvedValue(createdUser);
		otpGeneratorService.generate.mockReturnValue("654321");

		await useCase.execute(input);

		expect(userRepository.deleteById).not.toHaveBeenCalled();
		expect(passwordService.hashPassword).toHaveBeenCalledWith(input.password);
		expect(otpRepository.saveCode).toHaveBeenCalledWith(
			createdUser.id,
			"REGISTER",
			"654321",
			300,
		);
		expect(jobQueue.enqueue).toHaveBeenCalledWith("send-register-otp-email", {
			to: createdUser.email,
			name: createdUser.name,
			otp: "654321",
		});
	});
});
