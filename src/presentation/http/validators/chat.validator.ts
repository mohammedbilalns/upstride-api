import { z } from "zod";
import {
	buildObjectIdParamSchema,
	objectIdSchema,
} from "../../../shared/validators";

export const ChatQuerySchema = z.object({
	cursor: z.string().trim().min(1).optional(),
	filter: z.enum(["read", "unread", "all"]).default("all"),
});

export type ChatQuery = z.infer<typeof ChatQuerySchema>;

export const GetChatQuerySchema = z.object({
	cursor: z.string().trim().min(1).optional(),
});

export type GetChatQuery = z.infer<typeof GetChatQuerySchema>;

export const GetChatParamsSchema = buildObjectIdParamSchema("otherUserId");

export type GetChatParams = z.infer<typeof GetChatParamsSchema>;

export const ChatIdParamSchema = buildObjectIdParamSchema("chatId");

export type ChatIdParams = z.infer<typeof ChatIdParamSchema>;

export const SendMessageBodySchema = z
	.object({
		content: z.string().trim().min(1).optional(),
		mediaId: z.string().trim().min(1).optional(),
		messageType: z.enum(["TEXT", "IMAGE", "FILE"]).optional(),
		repliedTo: objectIdSchema.optional(),
	})
	.refine((data) => data.content || data.mediaId, {
		message: "Message content or media is required",
	});

export type SendMessageBody = z.infer<typeof SendMessageBodySchema>;
