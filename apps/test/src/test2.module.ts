import { Test2Controller } from './test2.controller';
import { Module } from "@nestjs/common";

@Module( {
    controllers: [
        Test2Controller,
    ]
} )
export class Test2Module {

}