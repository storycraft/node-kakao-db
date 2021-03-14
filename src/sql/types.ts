/*
 * Created on Tue Mar 09 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

import { Long, util } from "node-kakao";
import { SchemaType, TypeBindParam } from "./schema";

export const Integer: SchemaType<number> = {

  type: 'INTEGER',

  serialize(value: number): TypeBindParam {
    return ~~value;
  },

  deserialize(rawValue: unknown): number {
    return Number(rawValue);
  }

}

export const LongInteger: SchemaType<Long> = {

  type: 'INTEGER',

  serialize(value: Long): TypeBindParam {
    return value.toString();
  },

  deserialize(rawValue: { high: number, low: number }): Long {
    return Long.fromValue(rawValue);
  }

}

export const Text: SchemaType<string> = {

  type: 'TEXT',

  serialize(value: string): TypeBindParam {
    return value;
  },

  deserialize(rawValue: unknown): string {
    return String(rawValue);
  }

}

export const Record: SchemaType<Record<string, unknown>> = {

  type: 'TEXT',

  serialize(value: Record<string, unknown>): TypeBindParam {
    return util.JsonUtil.stringifyLoseless(value);
  },

  deserialize(rawValue: unknown): Record<string, unknown> {
    return util.JsonUtil.parseLoseless(String(rawValue));
  }

}
