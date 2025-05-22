import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '../../kafka/kafka.service';
import type { BaseResponse } from '@app/common';
import { throwCatchHtpp } from '@app/common/utils/http-throw-catch';

@Injectable()
export class GoogleStrategy extends PassportStrategy( Strategy, 'google' ) {
    constructor(
        private configService: ConfigService,
        private readonly kafkaService: KafkaService
    ) {

        super( {
            clientID: configService.get<string>( 'GOOGLE_CLIENT_ID' ),
            clientSecret: configService.get<string>( 'GOOGLE_CLIENT_SECRET' ),
            callbackURL: configService.get<string>( 'GOOGLE_CALLBACK_URL' ),
            scope: [ 'email', 'profile' ],
        } );
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { name, emails } = profile;
        const inforUser = {
            email: emails[ 0 ].value,
            name: name.givenName + ' ' + name.familyName,
            id: profile.id,
        }
        try {

            const result: BaseResponse = await this.kafkaService.validateGoogleUser( inforUser );
            done( null, result.data );

        } catch ( error ) {
            throw throwCatchHtpp( error )
        }

    }
}