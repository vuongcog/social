import type { BaseResponse } from "@app/common";
import type { UpdateDto } from "@app/common/dto/user.dto";
import { throwCatch } from "@app/common/utils/throw-catch";
import { PrismaService } from "@app/database";
import type { User } from "@app/database/generated/prisma";
import { HttpStatus, Injectable } from "@nestjs/common";

@Injectable()
export class UserProcessingService {
    constructor(
        private readonly prisma: PrismaService,
    ) {
    }

    async getUnindexedRecords( limit = 1000 ): Promise<BaseResponse> {
        try {
            const data = await this.prisma.user.findMany( {
                where: {
                    isIndexed: false
                },
                take: limit,
                orderBy: {
                    id: 'asc'
                }
            } );
            return {
                status: 'success',
                statusCode: HttpStatus.OK,
                message: 'Query successfully',
                data: data,
            }

        } catch ( error ) {
            throw throwCatch( error )
        }
    }


    async countUnindexedRecords(): Promise<BaseResponse> {
        try {
            const count = await this.prisma.user.count( {
                where: {
                    isIndexed: false
                }
            } );

            return {
                status: 'success',
                statusCode: HttpStatus.OK,
                message: 'Query successfully',
                data: {
                    count: count,
                },
            }

        } catch ( error ) {
            throw throwCatch( error )
        }
    }

    async updateUnIndexedEntities( options: any ): Promise<BaseResponse> {
        try {
            if ( !options.where.id.in ) {
                return {
                    status: "error",
                    statusCode: HttpStatus.BAD_REQUEST,
                    error: {
                        message: "Id List is null",
                    }
                }
            }
            const data = await this.prisma.user.updateMany( options );
            return {
                status: 'success',
                statusCode: HttpStatus.OK,
                message: 'Update successfully',
                data: data,
            }
        } catch ( error ) {
            throw throwCatch( error )
        }
    }



    async createUser( data: any ): Promise<BaseResponse> {

        try {
            if ( !data?.email ) {
                throw {
                    statusCode: HttpStatus.BAD_REQUEST,
                    status: "error",
                    error: {
                        message: "Email is undefind",
                    }
                } as BaseResponse
            }

            const exitUser = await this.prisma.user.findUnique( {
                where: { email: data.email }
            } );

            if ( exitUser ) {
                throw ( {
                    statusCode: HttpStatus.CONFLICT,
                    status: "error",
                    error: {
                        primaryMessage: `Email ${ data.email } is exited in database `
                    }
                } ) as BaseResponse;
            }

            const user = await this.prisma.user.create( {
                data,
            } );

            return {
                statusCode: HttpStatus.CREATED,
                status: "success",
                message: `Created User by Email ${ user.email }`,
                data: user,
            };
        }

        catch ( error: BaseResponse | any ) {
            throw throwCatch( error )
        }

    }

    async updateUser( id: string, data: Partial<UpdateDto> ): Promise<BaseResponse> {
        try {
            if ( !data ) {
                throw {
                    statusCode: HttpStatus.BAD_REQUEST,
                    status: "error",
                    error: {
                        message: "Data is empty",
                    }
                } as BaseResponse
            }
            if ( !id ) {
                throw {
                    statusCode: HttpStatus.BAD_REQUEST,
                    status: "error",
                    error: {
                        message: "User id is undefind",
                    }
                } as BaseResponse
            }

            const userExited = await this.prisma.user.findUnique( {
                where: {
                    id: id
                }
            } )

            if ( !userExited ) {
                throw {
                    status: "error",
                    statusCode: HttpStatus.CONFLICT,
                    error: {
                        message: "User not found in database",
                    }
                } as BaseResponse
            }



            if ( data?.email ) {
                const userEmailExited = await this.prisma.user.findUnique( {
                    where: {
                        email: data.email,
                        NOT: {
                            id: id,
                        },
                    }
                } )

                if ( userEmailExited ) {
                    throw {
                        status: "error",
                        statusCode: HttpStatus.CONFLICT,
                        error: {
                            message: "Email is exited ",
                        }
                    } as BaseResponse
                }

            }


            const user = await this.prisma.user.update( {
                where: { id },
                data,
            } );

            return {
                statusCode: HttpStatus.CREATED,
                status: "success",
                message: `Updated user ${ id }`,
                data: user,
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

            const user = await this.prisma.user.findUnique( {
                where: { id },
            } );

            if ( user ) {
                return {
                    statusCode: HttpStatus.OK,
                    status: "success",
                    message: `Has user ${ id } in database`,
                    data: user,
                };
            }

            return {
                statusCode: HttpStatus.NOT_FOUND,
                status: "success",
                message: `Not found user ${ id } `
            }


        } catch ( error ) {
            throw throwCatch( error )
        }

    }

    async findUserByEmail( email: string ): Promise<BaseResponse<User>> {
        try {

            const user = await this.prisma.user.findUnique( {
                where: { email },
            } );

            if ( !user ) {
                return {
                    statusCode: HttpStatus.OK,
                    status: 'success',
                    message: `User not found email ${ email } in anywhere`,
                };
            }

            return {
                statusCode: HttpStatus.OK,
                status: 'success',
                message: `Have User with Email ${ email } in database`,
                data: user,
            };

        } catch ( error: BaseResponse | any ) {
            throw throwCatch( error )

        }
    }

}