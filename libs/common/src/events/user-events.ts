export enum UserEventPatterns {
    USER_CREATED = 'user.created',
    USER_UPDATED = 'user.updated',
    USER_DELETED = 'user.deleted',
}

export class UserCreatedEvent {
    constructor( public readonly user: {
        id: string;
        email: string;
        name: string;
    } ) { }
}