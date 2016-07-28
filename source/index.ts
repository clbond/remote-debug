import { logger } from './logger';

import { ChromeConnection } from './protocol';

const connection = new ChromeConnection();

const promise = connection.connect('jsonplaceholder.typicode.com', 80);

promise.then(() => {
  logger.info('Connected!');

  connection.get('/posts/1', {
    'Content-Length': '0',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Host': 'jsonplaceholder.typicode.com',
    'Pragma': 'no-cache',
    'Referer': 'http://jsonplaceholder.typicode.com/'
  });
});

promise.catch(error => {
  logger.error(`Failed to connect: ${error}`);
});

connection.messages.subscribe(m => {
  console.log('Got message', m);
});
