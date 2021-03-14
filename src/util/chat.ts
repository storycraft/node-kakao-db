/*
 * Created on Mon Mar 08 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

import { Chatlog } from "node-kakao";
import { ChatlogModel, CHATLOG_SCHEMA, modelToChatlog } from "../chat";
import { rawToModel } from "../sql";

export function sqlRawIterToAsyncChatlog(
  iter: IterableIterator<ChatlogModel>
): AsyncIterableIterator<Chatlog> {
  return {
    [Symbol.asyncIterator]() {
      return this;
    },

    next: async () => {
      const next = iter.next();
      if (next.done) return next;

      return { done: false, value: modelToChatlog(rawToModel(CHATLOG_SCHEMA, next.value)) };
    }
  };
}
