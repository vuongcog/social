function createSortObject( sortString: string ): any[] {
    if ( !sortString ) return [];

    return sortString.split( ',' ).map( item => {
        const [ field, order = 'asc' ] = item.trim().split( ':' );
        return { [ field ]: { order } };
    } );
}
