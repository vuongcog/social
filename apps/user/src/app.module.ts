import { Module } from '@nestjs/common';
import { UserModule } from './user.module';
import { ConfigModule } from '@app/config';
import { DatabaseModule } from '@app/database';
import { KafkaModule } from '@app/kafka';

@Module( {
    imports: [
        ConfigModule,
        DatabaseModule,
        KafkaModule,
        UserModule,
    ],
} )
export class AppModule { }