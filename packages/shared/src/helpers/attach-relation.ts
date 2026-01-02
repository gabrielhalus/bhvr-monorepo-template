import type { WithRelations } from "@bunstack/shared/lib/type-utils";

/**
 * Attach a relation to a target.
 * @param target - The target to attach the relation to.
 * @param key - The key of the relation to attach.
 * @param value - The value of the relation to attach.
 */
export function attachRelation<
  TBase extends Record<PropertyKey, unknown>,
  TRelations extends Record<PropertyKey, unknown>,
  TKeys extends (keyof TRelations)[],
  K extends TKeys[number],
>(
  target: WithRelations<TBase, TRelations, TKeys>,
  key: K,
  value: TRelations[K],
): void {
  (target as Record<K, TRelations[K]>)[key] = value;
}
