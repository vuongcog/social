import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService, } from '@app/database';
import { User } from '@app/database/generated/prisma';
import { UserElasticSearchKafkaService } from './kafka/elasticsearch/user.elasticsearch-kafka.service';
import { printInformation } from '@app/common/utils/print-information';
import { type BaseResponse } from '@app/common';
import { throwCatch } from '@app/common/utils/throw-catch';
import type { UpdateDto } from '@app/common/dto/user.dto';
import { UserDataKafkaService } from './kafka/user/user.data-kafka.service';
import type { RegisterDto } from '@app/common/dto/auth.dto';
import { CACHE_EXPRIES } from '@app/common/constants/catch-expries';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject( CACHE_MANAGER ) private cacheManager: Cache,
        private readonly userElasticSearchKafkaClient: UserElasticSearchKafkaService,
        private readonly userDataKafkaClient: UserDataKafkaService,

    ) { }

    async createUser( data: RegisterDto ): Promise<BaseResponse> {

        try {

            const result: BaseResponse = await this.userDataKafkaClient.createUser( data )

            printInformation( result.data )

            const indexDocument = await this.userElasticSearchKafkaClient.emitUserCreated( result.data );

            const updateData: UpdateDto = {
                isIndexed: true,
            }

            const resultData: BaseResponse = await this.userDataKafkaClient.updateUser( result.data.id, updateData )

            return {
                statusCode: HttpStatus.CREATED,
                status: "success",
                message: `Created User by Email ${ result.data.email }`,
                messages: [ ...( indexDocument.messages ? indexDocument.messages : [] ) ],
                data: resultData.data,
            };
        }

        catch ( error: BaseResponse | any ) {
            throw throwCatch( error )

        }

    }

    async updateUser( id: string, data: UpdateDto ): Promise<BaseResponse> {
        try {

            const result = await this.userDataKafkaClient.updateUser( id, data )

            const cacheKey = `user:${ id }`;
            await this.cacheManager.set( cacheKey, result.data, CACHE_EXPRIES.id );

            if ( data.email ) {
                await this.cacheManager.del( `user:email:${ result.data.email }` );
            }
            const indexDocument = await this.userElasticSearchKafkaClient.emitUserCreated( result.data );

            return {
                statusCode: HttpStatus.CREATED,
                status: "success",
                message: `Updated user ${ id }`,
                messages: [ ...( indexDocument.messages ? indexDocument.messages : [] ) ],

                data: result.data,
            }

        } catch ( error ) {
            throw throwCatch( error )
        }
    }



    async findUserById( id: string ): Promise<BaseResponse> {
        try {
            if ( !id ) {
                throw {
                    statusCode: HttpStatus.BAD_REQUEST,
                    status: "error",
                    error: {
                        message: "Field id is undefine",
                    },
                }
            }

            const cacheKey = `user:${ id }`;
            const cachedUser = await this.cacheManager.get<User>( cacheKey );

            if ( cachedUser ) {
                return {
                    statusCode: HttpStatus.CREATED,
                    status: "success",
                    data: cachedUser,
                    message: `Has user ${ id } in cache`

                };
            }


            const result = await this.userDataKafkaClient.findUserById( id );

            if ( result.data ) {
                await this.cacheManager.set( cacheKey, result.data, CACHE_EXPRIES.id );
                return result;
            }

            return result;


        } catch ( error ) {
            throw throwCatch( error )
        }

    }

    async findUserByEmail( email: string ): Promise<BaseResponse> {
        try {
            const cacheKey = `user:email:${ email }`;
            const cachedUser = await this.cacheManager.get<User>( cacheKey );

            if ( cachedUser ) {
                return {
                    statusCode: HttpStatus.OK,
                    status: 'success',
                    message: `Have User with Email ${ email } in cache `,
                    data: cachedUser
                };
            }



            const result = await this.userDataKafkaClient.findUserByEmail( email )

            if ( !result?.data ) {
                return result
            }

            await this.cacheManager.set( cacheKey, result.data, CACHE_EXPRIES.email );

            return result

        } catch ( error: BaseResponse | any ) {
            throw throwCatch( error );


        }
    }

    async findAll() {
        try {

            return this.prisma.user.findMany();

        } catch ( error ) {
            throw throwCatch( error );
        }
    }

}