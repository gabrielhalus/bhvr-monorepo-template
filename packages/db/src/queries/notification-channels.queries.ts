import type { NotificationChannelUnion } from "@bunstack/shared/types/notification-channels.types";

import { eq } from "drizzle-orm";

import { drizzle } from "@/database";
import { NotificationChannels } from "@bunstack/shared/models/notifications-channels.model";
import { NotificationChannelSchema } from "@bunstack/shared/schemas/db/notification-channels.schemas";

// ============================================================================
// Core CRUD Operations
// ============================================================================

/**
 * Get all notification providers.
 * @returns All notification providers.
 */
export async function getNotificationChannels(): Promise<NotificationChannelUnion[]> {
  const rows = await drizzle
    .select()
    .from(NotificationChannels);

  return rows.map(row => NotificationChannelSchema.parse(row));
}

/**
 * Create a new notification channel.
 * @param channel - The notification channel to create.
 * @returns The created notification channel.
 * @throws An error if the notification channel could not be created.
 */
export async function createNotificationChannel(channel: NotificationChannelUnion): Promise<NotificationChannelUnion> {
  const [createdChannel] = await drizzle.insert(NotificationChannels).values(channel).returning();

  if (!createdChannel) {
    throw new Error(`Failed to create notification channel: ${channel.id}`);
  }

  return NotificationChannelSchema.parse(createdChannel);
}

/**
 * Update a notification channel.
 * @param channel - The notification channel to update.
 * @returns The updated notification channel.
 * @throws An error if the notification channel could not be updated.
 */
export async function updateNotificationChannel(channel: NotificationChannelUnion): Promise<NotificationChannelUnion> {
  const [updatedChannel] = await drizzle
    .update(NotificationChannels)
    .set(channel)
    .where(eq(NotificationChannels.id, channel.id))
    .returning();

  if (!updatedChannel) {
    throw new Error(`Notification channel not found: ${channel.id}`);
  }

  return NotificationChannelSchema.parse(updatedChannel);
}

/**
 * Delete a notification channel.
 * @param id - The ID of the notification channel to delete.
 * @returns The deleted notification channel.
 * @throws An error if the notification channel could not be deleted.
 */
export async function deleteNotificationChannel(id: string): Promise<NotificationChannelUnion> {
  const [deletedChannel] = await drizzle.delete(NotificationChannels).where(eq(NotificationChannels.id, id)).returning();

  if (!deletedChannel) {
    throw new Error(`Notification channel not found: ${id}`);
  }

  return NotificationChannelSchema.parse(deletedChannel);
}
