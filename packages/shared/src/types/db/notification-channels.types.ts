import type { Merge } from "@bunstack/shared/lib/type-utils";
import type { NotificationChannelsModel } from "@bunstack/shared/models/notifications-channels.model";

export type NotificationChannelRow = typeof NotificationChannelsModel.$inferSelect;

export type DiscordConfig = {
  webhookUrl: string;
  decorations: boolean;
};

export type TelegramConfig = {
  botToken: string;
  chatId: string;
  threadId?: string;
};

export type SlackConfig = {
  webhookUrl: string;
  channelId: string;
};

export type ChannelConfigMap = {
  DISCORD: DiscordConfig;
  TELEGRAM: TelegramConfig;
  SLACK: SlackConfig;
};

export type NotificationChannel<T extends keyof ChannelConfigMap> = Merge<Omit<NotificationChannelRow, "type" | "config">, { type: T; config: ChannelConfigMap[T] }>;

export type NotificationChannelUnion = NotificationChannel<keyof ChannelConfigMap>;
