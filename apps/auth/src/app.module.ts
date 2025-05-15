import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { ConfigModule } from '@app/config';
import { DatabaseModule } from '@app/database';

@Module( {
    imports: [
        ConfigModule,
        DatabaseModule,
        AuthModule,
    ],
} )
export class AppModule { }