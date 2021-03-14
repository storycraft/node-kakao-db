/*
 * Created on Mon Mar 08 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

import { util } from 'node-kakao';

export * from './chat';

const ESCAPE_REGXP = /[\0\b\t\n\r\x1a"'\\]/g; // eslint-disable-line no-control-regex
const ESCAPE_MAP: Record<string, string> = {
  '\0': '\\0',
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\r': '\\r',
  '\x1a': '\\Z',
  '"': '\\"',
  '\'': '\'\'',
  '\\': '\\\\'
};

function replacer(c: string): string {
  return ESCAPE_MAP[c] || '';
}

export function stringToSQLString(str: string): string {
  return `'${str.replace(ESCAPE_REGXP, replacer)}'`;
}

export function objectToSQLJSON(obj: Array<unknown> | Record<string, unknown>): string {
  return `'${util.JsonUtil.stringifyLoseless(obj).replace(/'/g, `''`)}'`;
}
