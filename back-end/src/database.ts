// database.ts
import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { UserNotFoundError, PlaylistExistsError } from './types/Errors';

export async function initializeDatabase(): Promise<Database> {
  const db = await open({
    filename: './data/DB.sqlite',
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT NOT NULL,
      private BOOLEAN NOT NULL,
      username TEXT NOT NULL,
      FOREIGN KEY(username) REFERENCES users(username)
    );
  `);

  return db;
}

export async function addUser(db: Database, username: string): Promise<void> {
  await db.run(`INSERT INTO users (username) VALUES (?)`, [username]);
}

export async function addPlaylist(db: Database, username: string, playlistId: string, isPrivate: boolean): Promise<void> {
  const user = await db.get(`SELECT username FROM users WHERE username = ?`, [username]);

  if (!user) {
    throw new UserNotFoundError(username);
  }

  const existingPlaylist = await db.get(`SELECT id FROM playlists WHERE id = ? AND username = ?`, [playlistId, username]);
  if (existingPlaylist) {

    throw new PlaylistExistsError("Playlist already exists");
  }
  await db.run(`INSERT INTO playlists (id, private, username) VALUES (?, ?, ?)`, [playlistId, isPrivate, username]);
}


export async function getUserPlaylists(db: Database, username: string): Promise<{ id: string, private: boolean }[] | string> {
  const user = await db.get(`SELECT username FROM users WHERE username = ?`, [username]);

  if (!user) {
    throw new UserNotFoundError(username);
  }

  const playlists = await db.all<{ id: string, private: boolean }[]>(`
    SELECT id, private FROM playlists WHERE username = ?
  `, [username]);

  return playlists;
}

export async function deletePlaylist(db: Database, playlistId: string, username: string): Promise<void> {
  const existingPlaylist = await db.get(`SELECT id FROM playlists WHERE id = ? AND username = ?`, [playlistId, username]);
  if (!existingPlaylist) {

    throw new PlaylistExistsError("Could not find playlist");
  }
  else {
    await db.run(`DELETE FROM playlists WHERE id = ? AND username = ?`, [playlistId, username]);
  }
}

export async function getAllUsers(db: Database): Promise<{ username: string }[]> {
  return db.all<{ username: string }[]>(`SELECT username FROM users`);
}

export async function getAllPlaylists(db: Database): Promise<{ id: string, private: boolean, username: string }[]> {
  return db.all<{ id: string, private: boolean, username: string }[]>(`SELECT id, private, username FROM playlists`);
}



