export const convertBrokers = (): string[] => {
    return process.env.KAFKA_BROKERS?.split( ',' ) || [
        'localhost:19092',
        'localhost:29092',
        'localhost:39092'
    ];
}