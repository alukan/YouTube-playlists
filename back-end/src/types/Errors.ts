export class UserNotFoundError extends Error {
    constructor(username: string) {
        super(`User not found: ${username}`);
        this.name = "UserNotFoundError";
    }
}

export class ExistsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ExistsError';
    }
}