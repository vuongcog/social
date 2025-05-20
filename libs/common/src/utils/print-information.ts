import chalk from 'chalk';

export function printInformation( obj: Record<string, any> ) {
    for ( const key in obj ) {
        if ( Object.prototype.hasOwnProperty.call( obj, key ) ) {
            const coloredKey = chalk.blueBright( key );
            const coloredValue = chalk.greenBright( String( obj[ key ] ) );

            console.log( `      ${ coloredKey }: ${ coloredValue }` );
        }
    }
}
