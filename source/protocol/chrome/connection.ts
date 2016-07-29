import { Subject, Observable } from 'rxjs';

import { logger } from '../../logger';
import { Connection, Message } from '../connection';
import { ConnectionState } from '../connection-state';

export type Message = any;

export class ChromeConnection extends Connection {
  private messageStream = new Subject<Message<any>>();

  public messages(): Observable<Message<any>> {
    return this.messageStream;
  }

  constructor() {
    super();

    this.stateTransition().subscribe(transition => {
      switch (transition.newState) {
        case ConnectionState.Connected:
          this.start();
          break;
        default:
          break;
      }
    });

    this.packets().subscribe(message => {
      if (message.error != null) {
        logger.error(`Received error from debugger instance: ${message.error.message}`);

        this.transition(ConnectionState.Failed);

        this.close();
      } else {
        this.messageStream.next(message);
      }
    })
  }

  protected start() {
    const all = Promise.all([
      this.send<any, any>('Debugger.enable'),
      this.send<any, any>('Console.enable')
    ]);

    all.then(() => this.transition(ConnectionState.Debugging));
  }
}