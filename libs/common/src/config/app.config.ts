import { registerAs } from '@nestjs/config';

export default registerAs( 'app', () => ( {
    nodeEnv: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'NestJS Microservices',
    port: parseInt( process.env.PORT || '3000', 10 ),
} ) );