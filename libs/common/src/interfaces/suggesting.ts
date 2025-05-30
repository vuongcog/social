export interface SuggestionOptions {
    field: 'name' | 'email' | 'all';
    size?: number;
    fuzzy?: boolean;
}

export interface SuggestionResult {
    text: string;
    score: number;
    source: any;
    type: 'name' | 'email';
}