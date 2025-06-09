import { Module } from "@nestjs/common";
import { TestModule } from "./test.module";
import { Test2Module } from "./test2.module";

@Module( {
    imports: [
        TestModule,
        Test2Module,
    ]
} )
export class AppModule {
}