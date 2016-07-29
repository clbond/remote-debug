import { Endpoint } from './endpoint';

export interface Discover {
  /// Connect to a target device and discover its debugging endpoints
  getEndpoints(targetUri: string, options?: DiscoverOptions): Promise<Map<string, Endpoint>>;
}

export interface DiscoverOptions {
  /// Should browser extensions be included in the list of discovered endpoints?
  extensions?: boolean;
}

export const defaultOptions: DiscoverOptions = { extensions: false };