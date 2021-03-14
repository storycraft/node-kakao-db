/*
 * Created on Tue Mar 09 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

export type TypeBindParam = string | number;

export type SchemaType<T> = {

  readonly type: string,

  serialize(value: T): TypeBindParam;
  deserialize(rawValue: unknown): T;

}

export type ColumnTags = 'primary' | 'unique' | '';

type ColumnBase<T> = {
  index: number,
  map: SchemaType<T>,
  nullable: boolean,
  tags?: ColumnTags
};

export type NotNullColumn<T> = ColumnBase<T> & { nullable: false };
export type NullableColumn<T> = ColumnBase<T> & { nullable: true };
export type Column<T> = NotNullColumn<T> | NullableColumn<T>;

/**
 * Construct non null column
 *
 * @template T
 * @param {number} index
 * @param {SchemaType<T>} map 
 * @param {ColumnTags?} tags 
 * @return {NotNullColumn<T>} NotNull Column
 */
export function col<T>(index: number, map: SchemaType<T>, tags?: ColumnTags): NotNullColumn<T> {
  return {
    index,
    map,
    nullable: false,
    tags
  };
}

/**
 * Construct nullable column
 *
 * @template T
 * @param {number} index
 * @param {SchemaType<T>} map 
 * @param {ColumnTags?} tags 
 * @return {NullableColumn<T>} Nullable column
 */
export function colOptional<T>(index: number, map: SchemaType<T>, tags?: ColumnTags): NullableColumn<T> {
  return {
    index,
    map,
    nullable: true,
    tags
  };
}

export type SchemaLike = { [key: string]: ColumnBase<unknown> };
export type ColumnValue<T> = T extends ColumnBase<infer U>
  ? (T extends NotNullColumn<U> ? U : (U | undefined))
  : never;

export type Model<S> = {
  [K in keyof S]: ColumnValue<S[K]>;
}
