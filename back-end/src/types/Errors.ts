export class UserNotFoundError extends Error {
    constructor(username: string) {
        super(`User not found: ${username}`);
        this.name = "UserNotFoundError";
    }
}

export class PlaylistExistsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PlaylistExistsError';
    }
}