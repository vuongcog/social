import appConfig from './app.config';
import authConfig from './auth.config';
import databaseConfig from './database.config';
import kafkaConfig from './kafka.config';

export const configs = [
    appConfig,
    authConfig,
    databaseConfig,
    kafkaConfig,
];

export * from './validation.schema';