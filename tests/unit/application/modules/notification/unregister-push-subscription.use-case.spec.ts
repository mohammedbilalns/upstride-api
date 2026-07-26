import { beforeEach, describe, expect, it } from "vitest";
import { UnregisterPushSubscriptionUseCase } from "../../../../../src/application/modules/notification/use-cases/unregister-push-subscription.use-case";
import type { IPushSubscriptionRepository } from "../../../../../src/domain/repositories/push-subscription.repository.interface";
import { createPushSubscription } from "../../../../factories/entities/push-subscription.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("UnregisterPushSubscriptionUseCase", () => {
	let pushSubscriptionRepository: ReturnType<
		typeof createMock<IPushSubscriptionRepository>
	>;
	let useCase: UnregisterPushSubscriptionUseCase;

	beforeEach(() => {
		pushSubscriptionRepository = createMock<IPushSubscriptionRepository>();
		useCase = new UnregisterPushSubscriptionUseCase(pushSubscriptionRepository);
	});

	it("should delete the endpoint when it exists for the user", async () => {
		pushSubscriptionRepository.findByUserId.mockResolvedValue([
			createPushSubscription({
				userId: "user-1",
				endpoint: "https://push.example.com/sub-1",
				keys: { p256dh: "key", auth: "auth" },
				deviceType: "web",
			}),
		]);

		await useCase.execute({
			userId: "user-1",
			endpoint: "https://push.example.com/sub-1",
		});

		expect(pushSubscriptionRepository.deleteByEndpoint).toHaveBeenCalledWith(
			"https://push.example.com/sub-1",
		);
	});

	it("should do nothing when the endpoint is not registered for the user", async () => {
		pushSubscriptionRepository.findByUserId.mockResolvedValue([]);

		await useCase.execute({
			userId: "user-1",
			endpoint: "https://push.example.com/sub-1",
		});

		expect(pushSubscriptionRepository.deleteByEndpoint).not.toHaveBeenCalled();
	});
});
