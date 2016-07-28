import { Logger, transports } from 'winston';

export const logger = new Logger({
  transports: [
    new (transports.Console)(),
  ]
});

logger.level = 'debug';

export default logger;
