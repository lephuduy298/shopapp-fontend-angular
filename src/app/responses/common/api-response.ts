// Generic API response wrapper interface to match new backend format
// { statusCode: number, error: string | null, message: any, data: T }
export interface ApiResponse<T> {
    statusCode: number;
    error: string | null;
    message: any;
    data: T;
}
