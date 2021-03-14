/*
 * Created on Tue Mar 09 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

export * from './schema';
export * from './types';

import { Column, Model, SchemaLike, TypeBindParam } from './schema';

export type StatementResult = {
  placeholders: string,
  values: (TypeBindParam | null)[]
}

/**
 * Get value placeholders of schema
 *
 * @template T
 * @param {T} schema
 * @return {string} values placeholder
 */
export function placeholders<T extends SchemaLike>(schema: T): string {
  return Array(Object.keys(schema).length).fill('?').join(',');
}

/**
 * Construct values using schema and model
 *
 * @template T
 * @param {T} schema 
 * @param {Model<T>} object 
 * @return {(TypeBindParam | null)[]} sql values
 */
export function values<T extends SchemaLike>(schema: T, object: Model<T>): (TypeBindParam | null)[] {
  const list: (TypeBindParam | null)[] = [];

  for (const key in schema) { // eslint-disable-line guard-for-in
    const column = schema[key];

    list[column.index] = serializeValue(column, object[key]);
  }

  return list;
}

/**
 * Construct partial updates of model
 *
 * @template T
 * @param {T} schema 
 * @param {Partial<Model<T>>} object 
 * @return {StatementResult} updates list [key, value]
 */
export function updates<T extends SchemaLike>(schema: T, object: Partial<Model<T>>): StatementResult {
  const values: (TypeBindParam | null)[] = [];

  for (const key in schema) {  // eslint-disable-line guard-for-in
    const column = schema[key];

    if (!(key in object)) continue;

    values.push(key, serializeValue(column, object[key]));
  }

  return {
    placeholders: Array(Object.keys(object).length).fill('?=?').join(','),
    values
  };
}

/**
 * Serialize value using column and value.
 *
 * @template T
 * @param {Column<T>} column Column data
 * @param {T | undefined} value
 * @return {TypeBindParam | undefined}
 */
 export function serializeValue<T>(column: Column<T>, value: T): TypeBindParam | null {
  if (column.tags && !column.nullable && value == null) {
    throw new Error('Tried to set nullish on non nullable key');
  }

  if (value != null) {
    return column.map.serialize(value);
  }

  return null;
}

/**
 * Deserialize value using column and value.
 *
 * @template T
 * @param {Column<T>} column Column data
 * @param {unknown} rawValue
 * @return {T | undefined}
 */
 export function deserializeValue<T>(column: Column<T>, rawValue: unknown): T | undefined {
  if (column.tags && !column.nullable && rawValue == null) {
    throw new Error('Tried to convert nullish on non nullable key');
  }

  return rawValue != null ? column.map.deserialize(rawValue): undefined;
}

/**
 * Construct SQL create table using schema.
 *
 * @template T
 * @param {Schema<T>} schema
 * @return {string}
 */
export function table<T extends SchemaLike>(schema: T): string {
  const list: string[] = [];

  for (const key in schema) {  // eslint-disable-line guard-for-in
    const { map, tags, nullable } = schema[key];
    let desc = `${key} ${map.type}`;

    if (tags) {
      if (tags === 'primary') {
        desc += ' PRIMARY KEY';
      } else if (tags === 'unique') {
        desc += ' UNIQUE';
      }
    }

    if (!nullable) {
      desc += ' NOT NULL';
    }

    list.push(desc);
  }

  return list.join(',');
}

/**
 * Deserialize raw result to model
 * @template T
 * @param {T} schema 
 * @param {Record<string, unknown>} raw 
 * @return {Model<T>}
 */
export function rawToModel<T extends SchemaLike>(
  schema: T,
  raw: Record<string, unknown>
): Model<T> {
  const model: Record<string, unknown> = {};

  for (const key in schema) { // eslint-disable-line guard-for-in
    const column = schema[key];

    if (!(key in raw)) throw new Error('Invalid raw value');

    model[key] = deserializeValue(column, raw[key]);
  }

  return model as Model<T>;
}
