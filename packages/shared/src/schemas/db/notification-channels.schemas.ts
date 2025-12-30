import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { NotificationChannelsModel } from "../../models/notifications-channels.model";

const BaseChannelSchema = createSelectSchema(NotificationChannelsModel).omit({ type: true, config: true });

/**
 * Schema for Discord notification channels
 */
export const DiscordChannelSchema = BaseChannelSchema.extend({
  type: z.literal("DISCORD"),
  config: z.object({
    webhookUrl: z.url(),
    decorations: z.boolean(),
  }),
});

/**
 * Schema for Telegram notification channels
 */
export const TelegramChannelSchema = BaseChannelSchema.extend({
  type: z.literal("TELEGRAM"),
  config: z.object({
    botToken: z.string(),
    chatId: z.string(),
    threadId: z.string().optional(),
  }),
});

/**
 * Schema for Slack notification channels
 */
export const SlackChannelSchema = BaseChannelSchema.extend({
  type: z.literal("SLACK"),
  config: z.object({
    webhookUrl: z.url(),
    channelId: z.string(),
  }),
});

/**
 * Schema for notification channels
 */
export const NotificationChannelSchema = z.discriminatedUnion("type", [
  DiscordChannelSchema,
  TelegramChannelSchema,
  SlackChannelSchema,
]);

/**
 * Map of notification channel schemas
 */
export const ChannelSchemaMap = {
  DISCORD: DiscordChannelSchema,
  TELEGRAM: TelegramChannelSchema,
  SLACK: SlackChannelSchema,
};

