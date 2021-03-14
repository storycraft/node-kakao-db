/*
 * Created on Wed Mar 03 2021
 *
 * Copyright (c) storycraft. Licensed under the GNU Lesser General Public License v3.
 */

import { sha1, sha256 } from "hash-wasm";
import * as path from 'path';

/**
 * Convert virtual path to real path
 */
export interface PathResolver {

  resolve(virtualPath: string): Promise<string>;

}

export const DefaultPathResolver: PathResolver = {
  async resolve(virtualPath: string): Promise<string> {
    return virtualPath;
  }
}

export const Sha1PathResolver: PathResolver = {

  resolve(virtualPath: string): Promise<string> {
    return sha1(virtualPath);
  }

}

export const Sha256PathResolver: PathResolver = {

  async resolve(virtualPath: string): Promise<string> {
    const hash = await sha256(virtualPath);
    return path.join(hash.substr(0, 2), hash.substr(2, 2), hash);
  }

}