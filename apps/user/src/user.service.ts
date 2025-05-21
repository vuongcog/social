import { console } from 'node:inspector/promises';
import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { PrismaService, } from '@app/database';
import { User } from '@app/database/generated/prisma';
import { KafkaService } from './kafka/kafka.service';
import chalk from 'chalk';
import { printInformation } from '@app/common/utils/print-information';
import { CONSTANTS, type BaseResponse } from '@app/common';
import { throwCatch } from '@app/common/utils/throw-catch';
import type { UpdateDto } from '@app/common/dto/user.dto';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject( CACHE_MANAGER ) private cacheManager: Cache,
        private readonly userElasticSearchKafkaClient: KafkaService,
    ) { }

    async createUser( data: any ): Promise<BaseResponse> {

        try {
            const exitUser = await this.prisma.user.findUnique( {
                where: { email: data.email }
            } );

            if ( exitUser ) {
                throw ( {
                    status: "error",
                    error: {
                        primaryMessage: `Email ${ data.email } is exited in database `
                    }
                } ) as BaseResponse;
            }

            const user = await this.prisma.user.create( {
                data,
            } );
            printInformation( user )

            // const indexDocument = await this.userElasticSearchKafkaClient.emitUserCreated( user );

            // if ( indexDocument ) {
            //     throw new ConflictException( 'not index to user' );
            // }

            return {
                status: "success",
                message: `Created User by Email ${ user.email }`,
                data: user,
            };
        }

        catch ( error: BaseResponse | any ) {
            if ( error.status ) {
                throw error as BaseResponse
            }
            else {
                throw {
                    status: 'error',
                    error: {
                        details: error,
                    }
                } as BaseResponse;
            }

        }

    }

    async updateUser( id: string, data: Partial<UpdateDto> ): Promise<BaseResponse> {
        try {
            if ( !id ) {
                throw {
                    status: "error",
                    error: {
                        message: "User Id is undefind",
                    }
                } as BaseResponse
            }

            const userExited: BaseResponse = await this.findUserById( id )

            if ( !userExited?.data ) {
                throw {
                    ...userExited,
                    status: "error",
                } as BaseResponse
            }

            const user = await this.prisma.user.update( {
                where: { id },
                data,
            } );

            const cacheKey = `user:${ id }`;
            await this.cacheManager.set( cacheKey, user, 600000 );

            if ( data.email ) {
                await this.cacheManager.del( `user:email:${ user.email }` );
            }
            return {
                status: "success",
                message: `Updated user ${ id }`,
                data: user,
            }

        } catch ( error ) {
            throw throwCatch( error )
        }
    }

    async deleteUser( id: string ): Promise<User> {
        const user = await this.prisma.user.findUnique( {
            where: { id },
        } );

        if ( !user ) {
            throw new NotFoundException( `User with ID ${ id } not found` );
        }

        await this.prisma.user.delete( {
            where: { id },
        } );

        await this.cacheManager.del( `user:${ id }` );
        await this.cacheManager.del( `user:email:${ user.email }` );
        await this.userElasticSearchKafkaClient.emitUserDeleted( id );

        return user;
    }


    async findUserById( id: string ): Promise<BaseResponse> {

        try {
            if ( !id ) {
                throw {
                    status: "error",
                    error: {
                        message: "Field id is undifine",
                    },
                }
            }

            const cacheKey = `user:${ id }`;
            const cachedUser = await this.cacheManager.get<User>( cacheKey );

            if ( cachedUser ) {
                return {
                    status: "success",
                    data: cachedUser,
                    message: `Has user ${ id } in cache`

                };
            }

            const user = await this.prisma.user.findUnique( {
                where: { id },
            } );

            if ( user ) {
                await this.cacheManager.set( cacheKey, user, 600000 );
                return {
                    status: "success",
                    message: `Has user ${ id } in database`,
                    data: user,
                };
            }
            return {
                status: "success",
                message: `Not found user ${ id } `
            }


        } catch ( error ) {
            throw throwCatch( error )
        }

    }

    async findUserByEmail( email: string ): Promise<BaseResponse<User>> {
        try {
            const cacheKey = `user:email:${ email }`;
            const cachedUser = await this.cacheManager.get<User>( cacheKey );

            if ( cachedUser ) {
                return {
                    status: 'success',
                    message: `Have User with Email ${ email } in cache `,
                    data: cachedUser
                };
            }

            const user = await this.prisma.user.findUnique( {
                where: { email },
            } );

            if ( !user ) {
                return {
                    status: 'success',
                    message: `User not found email ${ email } in anywhere`,
                };
            }

            await this.cacheManager.set( cacheKey, user, 600_000 );

            return {
                status: 'success',
                message: `Have User with Email ${ email } in database`,
                data: user,
            };

        } catch ( error: BaseResponse | any ) {
            if ( error.status ) {
                throw error as BaseResponse
            }
            else {
                throw {
                    status: 'error',
                    error: {
                        break: true,
                        details: error,
                    }
                } as BaseResponse;
            }

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