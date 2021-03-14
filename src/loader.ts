/*
 * Created on Sun Mar 07 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

import {
  AsyncClientDataLoadResult,
  Channel,
  ChannelInfo,
  ChannelUserInfo,
  ClientDataLoader,
  NormalChannelInfo,
  NormalChannelUserInfo,
  OpenChannel,
  OpenChannelInfo,
  OpenChannelUserInfo,
  UpdatableChannelDataStore,
  UpdatableChatListStore
} from "node-kakao";

import low, { AdapterAsync } from "lowdb";
import FileAsync = require("lowdb/adapters/FileAsync");
import { ChannelDataDBScheme, ChannelDataStore, ChatListStore } from "./store";
import { PathResolver } from "./path";
import * as path from 'path';
import * as fs from 'fs-extra';
import * as Bson from 'bson';
import * as crypto from 'crypto';
import { createMD5, sha256 } from "hash-wasm";
import Database from "better-sqlite3-sqlcipher";

export class NKDBClientDataLoader implements ClientDataLoader {

  constructor(
    private _rootDir: string,
    private _dataPath: string,
    private _pathResolver: PathResolver
  ) {

  }

  private async getPath(subPath: string): Promise<string> {
    return path.join(
      this._rootDir,
      await this._pathResolver.resolve(path.join(this._dataPath, subPath))
    );
  }

  async loadChatListStore(
    channel: Channel
  ): AsyncClientDataLoadResult<UpdatableChatListStore> {
    const db = await this.openChatDBFile(`chat$${channel.channelId.toString()}`);

    return {
      shouldUpdate: true,
      value: new ChatListStore(db)
    };
  }

  async loadNormalChannelStore(
    channel: Channel,
    lastUpdate?: number
  ): AsyncClientDataLoadResult<UpdatableChannelDataStore<NormalChannelInfo, NormalChannelUserInfo>> {
    const name = `channel$${channel.channelId.toString()}`;
    const defaultInfo = NormalChannelInfo.createPartial({});
    
    const store = await this.openChannelStore<NormalChannelInfo, NormalChannelUserInfo>(name, defaultInfo);
    
    return {
      shouldUpdate: !lastUpdate || store.lastUpdate <= lastUpdate,
      value: store
    };
  }

  async loadOpenChannelStore(
    channel: OpenChannel,
    lastUpdate?: number
  ): AsyncClientDataLoadResult<UpdatableChannelDataStore<OpenChannelInfo, OpenChannelUserInfo>> {
    const name = `open_channel$${channel.channelId.toString()}$${channel.linkId.toString()}`;

    const store = await this.openChannelStore<OpenChannelInfo, OpenChannelUserInfo>(
      name,
      OpenChannelInfo.createPartial({})
    );

    return {
      shouldUpdate: !lastUpdate || store.lastUpdate <= lastUpdate,
      value: store
    };
  }

  private async createNameKey(name: string): Promise<Uint8Array> {
    const hasher = await createMD5();
    hasher.update(name);
    return hasher.digest('binary');
  }

  private async openChannelDBFile<T>(
    name: string
  ): Promise<AdapterAsync<T>> {    
    const fullPath = await this.getPath(name);

    // lowdb bug fix
    await fs.ensureFile(fullPath);

    const key = await this.createNameKey(name);

    return new FileAsync(fullPath, {
      serialize: (data) => {
        const cipher = crypto.createCipheriv('aes-128-cbc', key, key);

        return Buffer.concat([
          cipher.update(Bson.serialize(data)),
          cipher.final()
        ]).toString('base64');
      },
      deserialize: (data) => {
        const deCipher = crypto.createDecipheriv('aes-128-cbc', key, key);

        const decrypted = Buffer.concat([deCipher.update(Buffer.from(data, 'base64')), deCipher.final()]);

        return Bson.deserialize(decrypted, { promoteLongs: false }) as T;
      }
    });
  }

  private async openChatDBFile(
    name: string
  ): Promise<Database.Database> {
    const fullPath = await this.getPath('chatdata');

    await fs.ensureDir(fullPath);

    const dbName = await sha256(name);
    const dbPath = path.join(fullPath, dbName);

    const key = await this.createNameKey(name);

    const db = new Database(dbPath, {});

    db.pragma(`key = "${key}"`);
    db.pragma('journal_mode = WAL');

    return db;
  }

  private async openChannelStore<T extends ChannelInfo, U extends ChannelUserInfo>(
    name: string,
    defaultInfo: T
  ): Promise<ChannelDataStore<T, U>> {
    const db = await low(await this.openChannelDBFile<ChannelDataDBScheme<T, U>>(name));

    await db.defaults({
      info: defaultInfo,
      users: {},
      watermarks: {},
      lastUpdate: 0
    }).write();

    return new ChannelDataStore(db);
  }

}
