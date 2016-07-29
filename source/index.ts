import 'babel-polyfill';

import { logger } from './logger';

import { ChromeConnection, ChromeDiscover } from './protocol';

const discover = new ChromeDiscover();

async function init() {
  const endpoints = await discover.getEndpoints('localhost:9222', {extensions: false});

  logger.debug('Received list of endpoints');

  for (const ep of endpoints) {
    const [id, endpoint] = ep;

    console.log(` > ${endpoint.title}`);
    console.log(`   id          ${id}`);
    console.log(`   browser uri ${endpoint.browserUri}`);
    console.log(`   control uri ${endpoint.debuggerUri}`);
    console.log();
  }

  const connection = new ChromeConnection();

  const promise = connection.connect(endpoints[0]);

  promise.then(() => {
    logger.info('Connected!');
  });

  promise.catch(error => {
    logger.error(`Failed to connect: ${error}`);
  });

  connection.messages.subscribe(m => {
    console.log('Got message', m);
  });
};

init().catch(error => {
  logger.error(`Failed to load remote debugger: ${error.stack}`);
});
