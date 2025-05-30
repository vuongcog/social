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
            updated_at: { type: 'date' },

            name_suggest: {
                type: 'completion',
                analyzer: 'simple',
                preserve_separators: true,
                preserve_position_increments: true,
                max_input_length: 50
            },
            email_suggest: {
                type: 'completion',
                analyzer: 'email_analyzer',
                preserve_separators: true,
                preserve_position_increments: true,
                max_input_length: 100
            }
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