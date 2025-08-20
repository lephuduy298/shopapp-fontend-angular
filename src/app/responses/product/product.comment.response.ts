import { UserResponse } from '../user/user.response';

export interface ProductCommentResponse {
    id?: number;
    content: string;
    updated_at?: any;
    user: UserResponse;
}
