import { Role } from '../../components/models.ts/role';

export interface UserResponse {
    id: number;
    fullname: string;
    phone_number: string;
    email: string;
    address: string;
    is_active: boolean;
    date_of_birth: Date;
    created_at: Date;
    updated_at: Date;
    facebook_account_id: number;
    google_account_id: number;
    role: Role;
}
