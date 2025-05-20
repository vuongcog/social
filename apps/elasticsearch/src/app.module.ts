import { Module } from "@nestjs/common";
import { MyElasticSearchModule } from './elasticsearch.module';
import { ConfigModule } from "@app/config";

@Module( {
    imports: [ MyElasticSearchModule, ConfigModule ],
} )
export class AppModule {
}