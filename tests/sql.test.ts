/*
 * Created on Tue Mar 09 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

import { assert } from 'chai';
import { sql } from '../src'
import { col, colOptional } from '../src/sql';

const TEST_SCHEMA = {
  'test': col(0, sql.Integer),
  'test2': colOptional(1, sql.Integer),
  'test3': colOptional(2, sql.Text)
}

describe('SQL API', () => {
  it('Value placeholders', () => {
    assert.equal(sql.placeholders(TEST_SCHEMA), '?,?,?');
  });

  it('Values', () => {
    assert.deepEqual(sql.values(TEST_SCHEMA, { 'test': 2, 'test2': 3, 'test3': 'str' }), [2, 3, 'str']);
  });

  it('Update', () => {
    const res = sql.updates(TEST_SCHEMA, { 'test': 2, 'test2': undefined });
    assert.equal(res.placeholders, '?=?,?=?');
    assert.deepEqual(res.values, ['test', 2, 'test2', null]);
  });

  it('Table', () => {
    assert.equal(sql.table(TEST_SCHEMA), 'test INTEGER NOT NULL,test2 INTEGER,test3 TEXT');
  });
});
