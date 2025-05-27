export const userMapping = {
    mappings: {
        properties: {
            id: { type: 'keyword' },
            name: {
                type: 'text',
                fields: {
                    keyword: { type: 'keyword' }
                }
            },
            email: {
                type: 'text',
                fields: {
                    keyword: { type: 'keyword' }
                }
            },
            provider: { type: 'keyword' },
            providerId: { type: 'keyword' },
            isActive: { type: 'boolean' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' }
        }
    },
    settings: {
        number_of_shards: 1,
        number_of_replicas: 1,
        analysis: {
            analyzer: {
                email_analyzer: {
                    type: 'custom',
                    tokenizer: 'uax_url_email',
                    filter: [ 'lowercase', 'stop' ]
                }
            }
        }
    }
};