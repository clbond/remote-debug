import { Observable, Subject } from 'rxjs';

import { Connection, Message } from '../connection';

import { Debugger } from '../debugger';

export class WebkitConnection extends Connection {
  private messageStream = new Subject<Message<any>>();

  public messages(): Observable<Message<any>> {
    return this.messageStream;
  }

  protected start(): Promise<Debugger> {
    return Promise.reject<Debugger>(new Error('Not implemented'));
  }

  constructor() {
    super();

    this.packets().subscribe(p => {
      // TODO(cbond): Handle message from server
    })
  }
}
