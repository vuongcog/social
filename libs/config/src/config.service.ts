import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
    constructor( private configService: NestConfigService ) { }

    get<T>( key: string ): T {
        const value = this.configService.get<T>( key );
        if ( value === undefined ) {
            throw new Error( `Config key "${ key }" not found` );
        }
        return value;
    }


    get isProduction(): boolean {
        return this.get<string>( 'NODE_ENV' ) === 'production';
    }

    get jwtSecret(): string {
        return this.get<string>( 'JWT_SECRET' );
    }

    get jwtExpiresIn(): string {
        return this.get<string>( 'JWT_EXPIRES_IN' );
    }

    get databaseUrl(): string {
        return this.get<string>( 'DATABASE_URL' );
    }

    get kafkaBrokerUrls(): string[] {
        const brokers = this.configService.get<string>( 'KAFKA_BROKERS' )?.split( ',' ) || [
            'localhost:19092',
            'localhost:29092',
            'localhost:39092'
        ];

        return brokers;
    }
}