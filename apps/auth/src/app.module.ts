import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { ConfigModule } from '@app/config';
import { DatabaseModule } from '@app/database';
import { KafkaModule } from './kafka/kafka.module';

@Module( {
    imports: [
        ConfigModule,
        DatabaseModule,
        AuthModule,
        KafkaModule,
    ],
} )
export class AppModule { }