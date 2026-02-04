export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type Merge<T1, T2> = Prettify<Omit<T1, keyof T2> & T2>;

export type WithRelations<
  TBase,
  TRelations extends Record<PropertyKey, unknown>,
  TKeys extends (keyof TRelations)[],
> = TBase & {
  [K in TKeys[number]]: TRelations[K];
};

export type WithRelationsCount<
  TBase,
  TRelations extends Record<PropertyKey, unknown>,
  TKeys extends (keyof TRelations)[],
> = TBase & {
  [K in TKeys[number]]: number;
};
