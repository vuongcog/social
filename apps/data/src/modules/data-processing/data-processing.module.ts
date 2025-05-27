import { Module } from "@nestjs/common";
import { UserProcessingService } from "./user-data-processing/data.user-processing.service";
import { UserProcessingController } from "./user-data-processing/data.user-processing.controller";
import { DatabaseModule } from "@app/database";

@Module(
    {
        imports: [ DatabaseModule ],
        providers: [ UserProcessingService ],
        controllers: [ UserProcessingController ],
        exports: [ UserProcessingService ],
    }
)
export class DataProcessingModule {
}