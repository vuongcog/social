import { Global, Module } from '@nestjs/common';
import { ConfigModule } from 'src/config/config.module';
import { KafkaService } from './kafka.service';

@Global()
@Module( {
    // imports: [ ConfigModule ],
    providers: [ KafkaService, ],
    exports: [ KafkaService, ],
} )
export class KafkaModule { }