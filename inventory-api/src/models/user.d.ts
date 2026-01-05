// src/models/user.d.ts
declare module 'user' {
    export function createUser(email: string, password: string, name: string): Promise<any>;
    export function findUserByEmail(email: string): Promise<any>;
    export function validatePassword(user: any, password: string): Promise<boolean>;
    export function generateAuthTokens(user: any): Promise<any>;
    export function refreshAccessToken(refreshToken: string): Promise<any>;
    export function revokeRefreshToken(refreshToken: string): Promise<void>;
    export function findUserById(id: string): Promise<any>;
}