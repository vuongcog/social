import { Module, type MiddlewareConsumer, type NestModule } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { UserMiddleware } from "./user.middleware";
import { UserKafkaService } from "./user-kafka.service";

@Module( {
    imports: [],
    controllers: [ UserController ],
    providers: [ UserService, UserKafkaService ],
    exports: [ UserService, UserKafkaService ]
} )
export class UserModule implements NestModule {
    configure( consumer: MiddlewareConsumer ) {
        consumer.apply( UserMiddleware ).forRoutes( "user" );
    }
}