import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
    private logger: winston.Logger;

    constructor( context?: string ) {
        this.logger = winston.createLogger( {
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
            ),
            defaultMeta: { service: context || 'app' },
            transports: [
                new winston.transports.Console(),
                // Thêm các transport khác nếu cần (file, HTTP, v.v.)
            ],
        } );
    }

    log( message: any, context?: string ) {
        this.logger.info( message, { context } );
    }

    error( message: any, trace?: string, context?: string ) {
        this.logger.error( message, { trace, context } );
    }

    warn( message: any, context?: string ) {
        this.logger.warn( message, { context } );
    }

    debug( message: any, context?: string ) {
        this.logger.debug( message, { context } );
    }

    verbose( message: any, context?: string ) {
        this.logger.verbose( message, { context } );
    }
}