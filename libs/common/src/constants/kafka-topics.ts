export enum KAFKA_TOPICS {
    USER_CREATED = 'user.created',
    USER_UPDATED = 'user.updated',
    USER_GET = 'user.get',
    USER_FIND_BY_EMAIL = 'user.find.by.email',
    USER_HEALTH = 'user.health',

    AUTH_REGISTER = 'auth.register',
    AUTH_LOGIN = 'auth.login',
    AUTH_VALIDATE = 'auth.validate',
    AUTH_GOOGLE_LOGIN = 'auth.google.login',
    AUTH_VALIDATE_GOOLE = "auth.validate.google",
    AUTH_VALIDATE_USER = "auth.validate.user",
    AUTH_HEALTH = 'auth.health',

    ELASTICSEARCH_CREATE_INDEX = "elasticsearch.create.index",
    ELASTICSEARCH_DELETE_INDEX = "elasticsearch.delete.index",
    ELASTICSEARCH_INDEX_DOCUMENT = 'elasticsearch.index.document',
    ELASTICSEARCH_DELETE_DOCUMENT = 'elasticsearch.delete.document',
    ELSATICSEARCH_SEARCH = "elasticsearch.search",
    ELASTICSEARCH_DELETE_ALL_DOCUMENT = "elasticsearch.delete.all.document",
    ELASTICSEARCH_MARK_EXISTING_RECORD_AS_INDEXED = 'elasticsearch.mark.record.as.indexed',
    ELASTICSEARCH_INDEX_RECORDS_AND_MARK_AS_INDEXED = 'elasticsearch.index-records.and.mark-as-indexed',
    ELASTICSEARCH_UPDATE_DOCUMENTS_AND_MARK_AS_INDEXED = 'elasticsearch.update-documents.and.mark-as-indexed',

    ELASTICSEARCH_ADVANCED_SEARCH = 'elasticsearch.advanced.search',
    ELASTICSEARCH_HEALTH = 'elasticsearch.health',

    DATA_CREATE_USER = "data.create.user",
    DATA_UPDATE_USER = 'data.update.user',
    DATA_GET_USER = 'data.get.user',
    DATA_GET_USER_BY_EMAIL = 'data.get.user.by.email',
    DATA_GET_USER_BY_ID = 'data.get.user.by.id',
    DATA_GET_UNINDEX_RECORD = 'data.get.unindex_records',
    DATA_GET_INDEXEX_RECORDS = 'data.get.indexed_records',
    DATA_GET_USERS = 'data.get.users',
    DATA_GET_UNINDEX_COUNT = 'data.get.unindex_count',
    DATA_UPDATE_FOR_UNINDEXED_ENTITIES = 'data.update.for.unindexed_entiteies',







}