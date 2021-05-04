/*
 * Created on Wed Mar 03 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

export * as chat from './chat';
export * as store from './store';
export * as sql from './sql';
export * as path from './path';
export * as util from './util';

import {
  network,
  LoginResult,
  talk,
  ClientConfig,
  AsyncCommandResult,
  Long,
  OAuthCredential,
  TalkClient
} from "node-kakao";
import { NodeKakaoDBConfig } from "./config";
import { NKDBClientDataLoader } from './loader';
import { Sha256PathResolver, PathResolver } from "./path";

export type ClientResult = {
  client: TalkClient,
  result: LoginResult
}

/**
 * NodeKakaoDB client has its own data directory
 */
export class NodeKakaoDB {

  private _config?: Partial<ClientConfig>;

  private _rootDir: string;

  constructor(
    config: NodeKakaoDBConfig,
    private _pathResolver: PathResolver = Sha256PathResolver,
    private _sessionFactory: network.SessionFactory = new talk.TalkSessionFactory()
  ) {
    this._config = config.client;

    this._rootDir = config.dataDir;
  }

  get rootDir(): string {
    return this._rootDir;
  }

  /**
   * Create new TalkClient with database loader
   *
   * Do not login with another account other than provided userId.
   * It may result database corruption.
   *
   * @param {Long | number} userId User id, used for database identifier
   * @return {TalkClient} TalkClient with database loader
   */
  create(userId: Long | number): TalkClient {
    return new TalkClient(
      this._config,
      new NKDBClientDataLoader(this._rootDir, `user$${userId.toString()}`, this._pathResolver),
      this._sessionFactory
    );
  }

  /**
   * Create new client and login using credential and user id.
   *
   * @param {Long | number} userId Account id, used for database identifier
   * @param {OAuthCredential} credential Account credential
   */
  async login(
    userId: Long | number,
    credential: OAuthCredential
  ): AsyncCommandResult<ClientResult> {
    const client = this.create(userId);

    const loginRes = await client.login(credential);
    if (!loginRes.success) return loginRes;

    return {
      status: loginRes.status,
      success: true,
      result: {
        client,
        result: loginRes.result
      }
    };
  }

}

