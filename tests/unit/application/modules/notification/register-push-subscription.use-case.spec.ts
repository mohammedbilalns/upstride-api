import { beforeEach, describe, expect, it } from "vitest";
import { RegisterPushSubscriptionUseCase } from "../../../../../src/application/modules/notification/use-cases/register-push-subscription.use-case";
import type { IPushSubscriptionRepository } from "../../../../../src/domain/repositories/push-subscription.repository.interface";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("RegisterPushSubscriptionUseCase", () => {
	let pushSubscriptionRepository: ReturnType<
		typeof createMock<IPushSubscriptionRepository>
	>;
	let useCase: RegisterPushSubscriptionUseCase;

	beforeEach(() => {
		pushSubscriptionRepository = createMock<IPushSubscriptionRepository>();
		useCase = new RegisterPushSubscriptionUseCase(pushSubscriptionRepository);
	});

	it("should save the push subscription", async () => {
		await useCase.execute({
			userId: "user-1",
			endpoint: "https://push.example.com/sub-1",
			keys: { p256dh: "key", auth: "auth" },
			deviceType: "web",
		});

		expect(pushSubscriptionRepository.save).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user-1",
				endpoint: "https://push.example.com/sub-1",
			}),
		);
	});
});
