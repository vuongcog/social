import { DataProcessingModule } from './modules/data-processing/data-processing.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@app/config';

@Module( {
  imports: [ ConfigModule, DataProcessingModule ],
  controllers: [],
  providers: [],
} )
export class DataModule { }
