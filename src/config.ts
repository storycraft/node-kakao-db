/*
 * Created on Wed Mar 03 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

import { ClientConfig } from "node-kakao";

export type NodeKakaoDBConfig = {

  /**
   * NodeKakao config override
   */
  client?: Partial<ClientConfig>,

  /**
   * NodeKakaoDB data directory
   */
  dataDir: string,

}