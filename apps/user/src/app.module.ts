import { Module } from '@nestjs/common';
import { UserModule } from './user.module';
import { DatabaseModule } from '@app/database';
import { KafkaModule } from '@app/kafka';
import { ConfigModule } from '@app/config';

@Module( {
    imports: [
        ConfigModule,
        DatabaseModule,
        KafkaModule,
        UserModule,
    ],
} )
export class AppModule { }