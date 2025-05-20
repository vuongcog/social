import { Module } from '@nestjs/common';
import { UserModule } from './user.module';
import { DatabaseModule } from '@app/database';
import { ConfigModule } from '@app/config';
import { KafkaModule } from './kafka/kafka.module';

@Module( {
    imports: [
        ConfigModule,
        DatabaseModule,
        UserModule,
    ],
} )
export class AppModule { }