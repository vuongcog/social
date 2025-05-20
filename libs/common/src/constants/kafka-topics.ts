export enum KAFKA_TOPICS {
    USER_CREATED = 'user.created',
    USER_UPDATED = 'user.updated',
    USER_DELETED = 'user.deleted',
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
    ELASTICSEARCH_ADVANCED_SEARCH = 'elasticsearch.advanced.search',
    ELASTICSEARCH_HEALTH = 'elasticsearch.health',

}