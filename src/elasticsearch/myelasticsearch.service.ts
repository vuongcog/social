import { Injectable } from '@nestjs/common';
import { ElasticsearchService  } from '@nestjs/elasticsearch';
import { console } from 'node:inspector/promises';

@Injectable()
export class MyElasticSearchService {
  constructor(private readonly esService: ElasticsearchService) {}

  async indexDocument(index: string, id: string| undefined, body: Record<string, any>) {
    return this.esService.index({
      index,
      id,
      body,
    });
  }
  

  async search(index: string, query: any) {
    return this.esService.search({
      index,
      body: {
        query,
      },
    });
  }

  async deleteDocument(index: string, id: string) {
    return this.esService.delete({
      index,
      id,
    });
  }

  async deleteIndex(index: string) {
    const exists = await this.esService.indices.exists({ index });

    if (!exists) {
      return { acknowledged: false, message: `Index "${index}" does not exist.` };
    }

    return this.esService.indices.delete({ index });
  }

  async createIndex(index: string, body: Record<string, any> = {}) {
    const exists = await this.esService.indices.exists({ index });

    if (exists) {
      return { acknowledged: false, message: `Index "${index}" already exists.` };
    }

    return this.esService.indices.create({
      index,
      body, // Optional: mappings, settings, etc.
    });
  }

}
