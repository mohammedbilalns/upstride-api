import { Notification } from "../../../src/domain/entities/notification.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createNotification(
	overrides: Partial<Notification> = {},
): Notification {
	const data = mergeDefaults<Notification>(
		{
			id: "notification-1",
			userId: "user-1",
			title: "New Message",
			description: "You have received a new message.",
			type: "CHAT",
			event: "MESSAGE_RECEIVED",
			createdAt: new Date(),
			isRead: false,
			readAt: undefined,
			metadata: undefined,
			deliveryStatus: {
				inApp: true,
				push: true,
				email: false,
			},
			actorId: undefined,
			relatedEntityId: undefined,
			updatedAt: new Date(),
		},
		overrides,
	);

	return new Notification(
		data.id,
		data.userId,
		data.title,
		data.description,
		data.type,
		data.event,
		data.createdAt,
		data.isRead,
		data.readAt,
		data.metadata,
		data.deliveryStatus,
		data.actorId,
		data.relatedEntityId,
		data.updatedAt,
	);
}
