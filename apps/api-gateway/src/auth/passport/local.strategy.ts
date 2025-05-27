import { BaseResponse } from './../../../../../libs/common/src/interfaces/response.interface';
import { Injectable, } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-local';
import { throwCatchHtpp } from '@app/common/utils/http-throw-catch';
import type { LoginDto } from '@app/common/dto/auth.dto';
import { AuthKafkaService } from '../../kafka/auth/gateway.auth-kafka.service';

@Injectable()
export class LocalStrategy extends PassportStrategy( Strategy ) {
    constructor( private readonly authKafkaService: AuthKafkaService
    ) {
        super( { usernameField: 'email' } );
    }
    async validate( email: string, password ): Promise<BaseResponse<LoginDto>> {
        try {
            const result: BaseResponse<LoginDto> = await this.authKafkaService.validateUser( email, password );

            return result;

        } catch ( error ) {
            throw throwCatchHtpp( error )
        }
    }

}