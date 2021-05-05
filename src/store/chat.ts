/*
 * Created on Sun Mar 07 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

import { Chatlog, Long, UpdatableChatListStore } from "node-kakao";
import { Database } from "better-sqlite3-sqlcipher";
import { sqlRawIterToAsyncChatlog } from "../util";
import { placeholders, table, updates, values } from "../sql";
import { ChatlogModel, chatlogToModel, CHATLOG_SCHEMA, partialChatlogToModel, rawToChatlog } from "../chat";

const SQL_INIT = `CREATE TABLE IF NOT EXISTS chats (${table(CHATLOG_SCHEMA)})`;
const CHAT_INSERT = `INSERT OR REPLACE INTO chats VALUES (${placeholders(CHATLOG_SCHEMA)})`;

export class ChatListStore implements UpdatableChatListStore {

  constructor(
    private _db: Database
  ) {
    _db.defaultSafeIntegers(true);
    _db.prepare(SQL_INIT).run();
  }

  async last(): Promise<Chatlog | undefined> {
    const read = this._db.prepare('SELECT * from chats WHERE logId = (SELECT MAX(logId) from chats)').get();

    if (!read) return;
  
    return rawToChatlog(read);
  }

  async addChat(...chats: Chatlog[]): Promise<void> {
    const statement = this._db.prepare(CHAT_INSERT);
    for (const chat of chats) {
      statement.run(...values(CHATLOG_SCHEMA, chatlogToModel(chat)));
    }
  }

  async updateChat(logId: Long, chat: Partial<Chatlog>): Promise<void> {
    const res = updates(CHATLOG_SCHEMA, partialChatlogToModel(chat));
    this._db.prepare(`UPDATE chats SET ${res.placeholders} WHERE logId = ?`).run(res.values, logId.toString());
  }

  async removeChat(logId: Long): Promise<boolean> {
    return this._db.prepare('DELETE from chats WHERE logId = ?').run(logId.toString()).changes > 0;
  }

  async get(logId: Long): Promise<Chatlog | undefined> {
    const read = this._db.prepare('SELECT * from chats WHERE logId = ? LIMIT 1').get(logId.toString());
    if (!read) return;

    return rawToChatlog(read);
  }

  before(logId: Long, maxCount?: number): AsyncIterableIterator<Chatlog> {
    const sql = 'SELECT * FROM chats WHERE logId < ?';

    let iterator: IterableIterator<ChatlogModel>;
    if (maxCount) {
      iterator = this._db.prepare(`${sql} ORDER BY logId DESC LIMIT ?`).iterate(logId.toString(), maxCount);
    } else {
      iterator = this._db.prepare(sql).iterate(logId.toString());
    }

    return sqlRawIterToAsyncChatlog(iterator);
  }

  since(time: number): AsyncIterableIterator<Chatlog> {
    const iterator = this._db.prepare(`SELECT * from chats WHERE sendAt >= ? ORDER BY logId ASC`).iterate(time);

    return sqlRawIterToAsyncChatlog(iterator);
  }

  all(): AsyncIterableIterator<Chatlog> {
    const iterator = this._db.prepare('SELECT * from chats ORDER BY logId ASC').iterate();
  
    return sqlRawIterToAsyncChatlog(iterator);
  }
}
