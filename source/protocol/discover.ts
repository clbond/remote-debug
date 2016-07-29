import { Endpoint } from './endpoint';

export interface Discover {
  /// Connect to a target device and discover its debugging endpoints
  getEndpoints(targetUri: string): Promise<Map<string, Endpoint>>;
}