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


export class AutocompleteSuggestionDto {
    q: string;
    field?: 'name' | 'email' | 'all' = 'all';
    size?: number = 10;
    fuzzy?: boolean = false;
}

export class SpellingSuggestionDto {
    q: string;
    field?: 'name' | 'email' = 'name';
}

export class SearchWithSuggestionsDto {
    q: string;
    suggest?: string;
    page?: number = 1;
    limit?: number = 10;
    sort?: string;
}

export class ContextualSuggestionDto {
    q: string;
    active?: boolean;
    provider?: string;
    size?: number = 10;
}