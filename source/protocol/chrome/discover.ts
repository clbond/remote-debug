import 'isomorphic-fetch';

import { logger } from '../../logger';

import {
  defaultOptions,
  Discover,
  DiscoverOptions,
} from '../discover';

import { Endpoint } from '../endpoint';

export class ChromeDiscover implements Discover {
  async getEndpoints(targetUri: string, options: DiscoverOptions = defaultOptions) {
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

      let results = endpoints.map(toEndpoint);

      if (options.extensions === false) {
        results = results.filter(r => (/chrome-extension:/.test(r.browserUri) === false));
      }

      for (const e of results) {
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