import apiGatewayServiceConnectionConfig from './api-gateway-service-connection.config';
import authConfig from './auth.config';

export const configs = [
    authConfig,
    apiGatewayServiceConnectionConfig

];

export * from './validation.schema';