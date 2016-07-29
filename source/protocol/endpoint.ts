export interface Endpoint {
  /// Unique identifier
  id: string;

  /// The socket URI that we can connect to to control this endpoint
  debuggerUri: string;

  /// The URI of the current browser location
  browserUri: string;

  /// Terse single-line description
  title: string;
}