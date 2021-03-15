/*
 * Created on Sun Mar 07 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

import { ChannelInfo, ChannelUser, ChannelUserInfo, ChatLogged, Long, UpdatableChannelDataStore } from "node-kakao";

import { LowdbAsync } from "lowdb";

export type ChannelDataDBScheme<T, U> = {

  info: T,
  users: Record<string, U>,
  watermarks: Record<string, string>,
  lastUpdate: number

}

export class ChannelDataStore<T extends ChannelInfo, U extends ChannelUserInfo>
implements UpdatableChannelDataStore<T, U> {

  constructor(
    private _db: LowdbAsync<ChannelDataDBScheme<T, U>>
  ) {
    
  }

  private get state(): ChannelDataDBScheme<T, U> {
    return this._db.getState();
  }

  get info(): Readonly<T> {
    return this.state.info;
  }

  get userCount(): number {
    return this._db.get('users').size().value();
  }

  get lastUpdate(): number {
    return this._db.get('lastUpdate', 0).value();
  }

  getUserInfo(user: ChannelUser): Readonly<U> | undefined {
    return this._db.get('users').get(user.userId.toString()).value() as (U | undefined);
  }

  getAllUserInfo(): IterableIterator<U> {
    const values = this._db.get('users').values().value().reverse();
    
    return {
      [Symbol.iterator]() {
        return this;
      },

      next() {
        const value = values.pop();
        if (!value) return { done: true, value: null };

        return { done: false, value };
      }
    }
  }

  clearUserList(): void {
    this._db.set('users', {}).write().then();
  }

  getReadCount(chat: ChatLogged): number {
    return this._db.get('watermarks').filter((val) => {
      return chat.logId.greaterThanOrEqual(val);
    }).size().value();
  }

  getReaders(chat: ChatLogged): Readonly<U>[] {
    const userEntry = this._db.get('users');

    return this._db.get('watermarks')
      .filter((val) => chat.logId.greaterThanOrEqual(val))
      .map((val) => userEntry.get(val).value()).value() as U[];
  }

  updateInfo(info: Partial<T>): void {
    let infoUpdateP: Promise<unknown>;
    if (this._db.has('info').value()) {
      infoUpdateP = this._db.get('info').merge(info).write();
    } else {
      infoUpdateP = this._db.set('info', info).write();
    }

    infoUpdateP.then(() => {
      this._db.set('lastUpdate', Math.floor(Date.now() / 1000)).write().then();
    });
  }

  setInfo(info: T): void {
    this._db.set('info', info).write().then(() => {
      this._db.set('lastUpdate', Math.floor(Date.now() / 1000)).write().then();
    });
  }

  updateUserInfo(user: ChannelUser, info: Partial<U>): void {
    const userEntry = this._db.get('users');
    const strId = user.userId.toString();

    if (userEntry.has(strId).value()) {
      userEntry.get(strId).merge(info).write().then();
    } else {
      userEntry.set(strId, info).write().then();
    }
  }

  removeUser(user: ChannelUser): boolean {
    const strId = user.userId.toString();

    const userInfoRes = this._db.get('users').unset(strId).value();
    const watermarkRes = this._db.get('watermarks').unset(strId).value();

    this._db.write().then();

    return userInfoRes || watermarkRes;
  }
  
  updateWatermark(readerId: Long, watermark: Long): void {
    this._db.set(`watermarks.${readerId.toString()}`, watermark.toString()).write().then();
  }

  clearWatermark(): void {
    this._db.set('watermarks', {}).write().then();
  }

}
