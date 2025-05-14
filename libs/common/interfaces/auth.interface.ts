import type { User } from "./user.interface";

export interface TokenPayload {
    sub: string;
    username: string;
    roles: string[];
}
export interface AuthResponse {
    accessToken: string;
    user: User;
}