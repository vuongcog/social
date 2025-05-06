import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { IndexDocumentDto } from './dto/index-document.dto';
import  { MyElasticSearchService } from './myelasticsearch.service';

@Controller('elasticsearch')
export class ElasticsearchController {
  constructor(private readonly elasticsearchService: MyElasticSearchService) {}

  @Get()
  create (){
    return "hello";
  }

  @Post('index')
  async indexDocument(@Body() dto: IndexDocumentDto) {
    return this.elasticsearchService.indexDocument(dto.index, dto.id, dto.body);
  }

  @Delete('index/:name')
  async deleteIndex(@Param('name') indexName: string) {
    return this.elasticsearchService.deleteIndex(indexName);
  }

  @Post('index/:name')
  async createIndex(
    @Param('name') indexName: string,
    @Body() body: Record<string, any>,
  ) {
    return this.elasticsearchService.createIndex(indexName, body);
  }
}
