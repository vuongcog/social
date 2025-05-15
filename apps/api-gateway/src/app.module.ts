import { Module } from '@nestjs/common';
import { ConfigModule } from '@app/config';
import { KafkaModule } from './kafka/kafka.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module( {
    imports: [
        ConfigModule,
        KafkaModule,
        AuthModule,
        UserModule,
    ],
} )
export class AppModule { }