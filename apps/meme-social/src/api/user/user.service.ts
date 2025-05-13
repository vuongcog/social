import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateUserDTO } from "./dto/create-user.dto";
import { UserKafkaService } from "src/api/user/user-kafka.service";
import { MyElasticSearchService } from "src/elasticsearch/myelasticsearch.service";
import { QueryDslQueryContainer } from "@elastic/elasticsearch/lib/api/types";


@Injectable()
export class UserService {
    constructor( private prismaService: PrismaService, private readonly userKafkaService: UserKafkaService, private readonly esService: MyElasticSearchService ) { }


    async create( data: any ) {
        const exitUser = await this.prismaService.user.findUnique( {
            where: { email: data.email }
        } );

        if ( exitUser ) {
            throw new ConflictException( 'Email already exists' );
        }

        const user = await this.prismaService.user.create( {
            data,
        } );
        const a = 1;
        await this.userKafkaService.emitUserCreated( user );

        return user;

    }


    async update( id: string, data: any ) {

        const user = await this.prismaService.user.update( {
            where: { id },
            data: {
                ...data,
                updated_at: new Date(),
            },
        } );

        await this.userKafkaService.emitUserUpdated( user );

        return user;
    }

    async delete( id: string ) {
        const user = await this.prismaService.user.delete( {
            where: { id },
        } );

        await this.userKafkaService.emitUserDeleted( id );

        return user;
    }




    async findAll() {
        return this.prismaService.user.findMany();
    }

    async findById( id: string ) {
        return this.prismaService.user.findUnique( {
            where: { id },
        } );
    }
    async searchUsers( query: any ) {
        const result = await this.esService.search( 'users', query );
        return result.hits.hits;
    }

    async searchByText( text: string ) {
        const query = {
            multi_match: {
                query: text,
                fields: [ 'name', 'email' ],
                type: 'best_fields',
                fuzziness: 'AUTO',
            },
        };

        return this.searchUsers( query );
    }


    async searchWithFilters( options: any = {} ) {
        const { name, email, provider, isActive, text } = options;

        const must: QueryDslQueryContainer[] = [];

        if ( text ) {
            must.push( {
                multi_match: {
                    query: text,
                    fields: [ 'name', 'email' ],
                    fuzziness: 'AUTO',
                },
            } );
        }

        if ( name ) {
            must.push( { match: { 'name.keyword': name } } );
        }

        if ( email ) {
            must.push( { match: { 'email.keyword': email } } );
        }

        if ( provider ) {
            must.push( { term: { provider } } );
        }

        if ( isActive !== undefined ) {
            must.push( { term: { isActive } } );
        }

        const query = {
            bool: { must },
        };

        return this.searchUsers( query );
    }

    async syncToElasticsearch() {
        return this.userKafkaService.syncAllUsers();
    }
    async findByEmail( email: string ) {
        return this.prismaService.user.findUnique( { where: { email } } )
    }


}



