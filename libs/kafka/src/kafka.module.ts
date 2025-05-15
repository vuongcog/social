

import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { ConfigModule } from '@app/config';

@Module( {
  imports: [ ConfigModule ],
  providers: [ KafkaService ],
  exports: [ KafkaService ],
} )
export class KafkaModule { }