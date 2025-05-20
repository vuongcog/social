import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-local';
import { KafkaService } from "../../kafka/kafka.service";

@Injectable()
export class LocalStrategy extends PassportStrategy( Strategy ) {
    constructor( private kafkaService: KafkaService ) {
        super( { usernameField: 'email' } );
    }
    async validate( email: string, password ): Promise<any> {
        const user = await this.kafkaService.validateUser( email, password );
        if ( !user ) {
            throw new UnauthorizedException();
        }
        return user;
    }

}