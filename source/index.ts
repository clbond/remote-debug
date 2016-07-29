import 'babel-polyfill';

import { logger } from './logger';

import { ChromeConnection, ChromeDiscover } from './protocol';

async function locate() {
  const discover = new ChromeDiscover();

  const endpoints = await discover.getEndpoints('localhost:9222', { extensions: false });

  logger.debug('Received list of endpoints');

  for (const ep of endpoints) {
    const [id, endpoint] = ep;

    console.log(` > ${endpoint.title}`);
    console.log(`   id          ${id}`);
    console.log(`   browser uri ${endpoint.browserUri}`);
    console.log(`   control uri ${endpoint.debuggerUri}`);
    console.log();
  }

  return endpoints;
}

async function connect(id: string) {
  const discovered = await locate();

  if (discovered.has(id) === false) {
    throw new Error(`Browser instance ID does not exist: ${id}`);
  }

  const connection = new ChromeConnection();

  const promise = connection.connect(discovered.get(id));

  promise.then(() => {
    logger.info('Connected');
  });

  promise.catch(error => {
    logger.error(`Failed to connect: ${error}`);
  });

  connection.messages().subscribe(m => {
    console.log('Got message', m);
  });
}

if (process.argv.length < 3) {
  locate().catch(error => {
    logger.error(`Failed to discover debuggable instances: ${error.stack}`);
  });
}
else {
  connect(process.argv[2]).catch(error => {
    logger.error(`Failed to connect remote debugger: ${error.stack}`);
  });
}