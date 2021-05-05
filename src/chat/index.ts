/*
 * Created on Wed Mar 10 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

import { Chatlog, Long } from "node-kakao";
import { col, Integer, LongInteger, Model, colOptional, Record, Text, rawToModel } from "../sql";

export const CHATLOG_SCHEMA = {

  'logId': col(0, LongInteger, 'primary'),
  'prevLogId': col(1, LongInteger),

  'senderId': col(2, LongInteger),

  'type': col(3, Integer),

  'text': colOptional(4, Text),

  'sendAt': col(5, Integer),

  'messageId': col(6, LongInteger),

  'attachment': colOptional(7, Record),
  'supplement': colOptional(8, Record)

};

export type ChatlogModel = Model<typeof CHATLOG_SCHEMA>;

export function chatlogToModel(chatlog: Chatlog): ChatlogModel {
  return {
    logId: chatlog.logId,
    prevLogId: chatlog.prevLogId,
    senderId: chatlog.sender.userId,
    type: chatlog.type,
    text: chatlog.text,
    sendAt: Math.floor(chatlog.sendAt / 1000),
    messageId: Long.fromValue(chatlog.messageId),
    attachment: chatlog.attachment,
    supplement: chatlog.supplement
  };
}

export function partialChatlogToModel(chatlog: Partial<Chatlog>): Partial<ChatlogModel> {
  const partial: Partial<ChatlogModel> = {};

  if ('logId' in chatlog) partial.logId = chatlog.logId;
  if ('prevLogId' in chatlog) partial.prevLogId = chatlog.prevLogId;

  if (chatlog.sender) partial.senderId = chatlog.sender.userId;
  
  if ('type' in chatlog) partial.type = chatlog.type;
  if ('text' in chatlog) partial.text = chatlog.text;
  if ('sendAt' in chatlog) partial.sendAt = chatlog.sendAt ? Math.floor(chatlog.sendAt / 1000) : 0;
  if (chatlog.messageId != null) partial.messageId = Long.fromValue(chatlog.messageId);

  if ('attachment' in chatlog) partial.attachment = chatlog.attachment;
  if ('supplement' in chatlog) partial.supplement = chatlog.supplement;

  return partial;
}

export function rawToChatlog(raw: Record<string, unknown>): Chatlog {
  const model = rawToModel(CHATLOG_SCHEMA, raw);

  return modelToChatlog(model);
}

export function modelToChatlog(model: ChatlogModel): Chatlog {
  return {
    logId: model.logId,
    prevLogId: model.prevLogId,
    sender: { userId: model.senderId },
    type: model.type,
    text: model.text,
    sendAt: model.sendAt * 1000,
    messageId: model.messageId,
    attachment: model.attachment,
    supplement: model.supplement
  };
}
