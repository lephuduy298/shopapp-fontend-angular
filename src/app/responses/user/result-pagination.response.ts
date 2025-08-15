export interface ResultPagination {
    result: any[];
    meta: {
        totalItems: number;
        totalPage: number;
        // currentPage?: number;
        // itemsPerPage?: number;
    };
}
