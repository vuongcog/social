import { Inject } from '@nestjs/common';

export const InjectKafkaClient = ( name: string ) => Inject( name );