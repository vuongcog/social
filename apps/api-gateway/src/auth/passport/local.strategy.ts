import { BaseResponse } from './../../../../../libs/common/src/interfaces/response.interface';
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-local';
import { KafkaService } from "../../kafka/kafka.service";
import { throwCatch } from '@app/common/utils/throw-catch';
import { throwCatchHtpp } from '@app/common/utils/http-throw-catch';
import type { LoginDto } from '@app/common/dto/auth.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy( Strategy ) {
    constructor( private kafkaService: KafkaService ) {
        super( { usernameField: 'email' } );
    }
    async validate( email: string, password ): Promise<BaseResponse<LoginDto>> {
        try {
            const result: BaseResponse<LoginDto> = await this.kafkaService.validateUser( email, password );

            return result;

        } catch ( error ) {
            throw throwCatchHtpp( error )
        }
    }

}