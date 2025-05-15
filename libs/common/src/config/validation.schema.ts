import * as Joi from 'joi';

export const validationSchema = Joi.object( {
    NODE_ENV: Joi.string().valid( 'development', 'production', 'test' ).default( 'development' ),
    PORT: Joi.number().default( 3000 ),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRATION: Joi.string().default( '1d' ),
    KAFKA_BROKERS: Joi.string().default( 'localhost:9092' ),
    KAFKA_GROUP_ID: Joi.string().default( 'nest-microservices' ),
} );