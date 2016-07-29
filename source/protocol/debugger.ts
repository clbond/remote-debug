import { Observable, ReplaySubject } from 'rxjs';

import { ConnectionState } from './connection-state';

import { Script } from './script';

export interface ConsoleMessage {
  timestamp: Date;
  text: string;
  url: string;
  sourcePosition: [number, number];
}

export abstract class Debugger {
  protected consoleStream = new ReplaySubject<ConsoleMessage>();

  public get consoleMessages(): Observable<ConsoleMessage> {
    return this.consoleStream;
  }

  protected connectionStateStream = new ReplaySubject<ConnectionState>();

  public get connectionState(): Observable<ConnectionState> {
    return this.connectionStateStream;
  }

  protected parsedScriptsStream = new ReplaySubject<Script>();

  public get parsedScripts(): Observable<Script> {
    return this.parsedScriptsStream;
  }
}