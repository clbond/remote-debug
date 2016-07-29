import 'isomorphic-fetch';

import { logger } from '../../logger';

import { Discover } from '../discover';
import { Endpoint } from '../endpoint';

export class ChromeDiscover implements Discover {
  async getEndpoints(targetUri: string): Promise<Map<string, Endpoint>> {
    try {
      const endpoints = await fetch(`http://${targetUri}/json`).then(r => r.json());

      const toEndpoint = (t): Endpoint => {
        const {id, url, webSocketDebuggerUrl, title} = t;

        return {
          id,
          browserUri: url,
          debuggerUri: webSocketDebuggerUrl,
          title,
        };
      };

      const map = new Map<string, Endpoint>();

      for (const e of endpoints.map(toEndpoint)) {
        map.set(e.id, e);
      }

      return map;
    }
    catch (error) {
      logger.error(`Failed to discover debugging endpoints from ${targetUri}: ${error.stack}`);
      throw error;
    }
  }
}