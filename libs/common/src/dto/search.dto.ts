export class SearchPaginationDto {
    query: any;
    page?: number = 1;
    limit?: number = 10;
    sort?: any;
    _source?: string[];
    highlight?: any;
}

export interface PaginatedSearchResponse {
    status: string;
    statusCode: number;
    message: string;
    data: {
        items: any[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            from: number;
            to: number;
        };
        took: number;
    };
}