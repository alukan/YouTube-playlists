import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { UserNotFoundError, ExistsError } from './types/Errors';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(__dirname, 'db', 'mydb.sqlite');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export async function initializeDatabase(): Promise<Database> {
  const db = await open({
    filename: dbPath,
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
      playlistname TEXT NOT NULL,
      FOREIGN KEY(username) REFERENCES users(username)
    );
  `);

  return db;
}

export async function checkUser(db: Database, username: string): Promise<void> {
  const user = await db.get(`SELECT username FROM users WHERE username = ?`, [username]);

  if (!user) {
    throw new ExistsError(`User ${username} is not found`);
  }

}

export async function addUser(db: Database, username: string): Promise<void> {
  const user = await db.get(`SELECT username FROM users WHERE username = ?`, [username]);

  if (user) {
    throw new ExistsError(`User ${username} already exists`);
  }

  await db.run(`INSERT INTO users (username) VALUES (?)`, [username]);
}

export async function addPlaylist(db: Database, username: string, playlistId: string, isPrivate: boolean, playlistname: string): Promise<void> {
  const user = await db.get(`SELECT username FROM users WHERE username = ?`, [username]);

  if (!user) {
    throw new UserNotFoundError(username);
  }

  const existingPlaylist = await db.get(`SELECT id FROM playlists WHERE playlistname = ? AND username = ?`, [playlistname, username]);
  if (existingPlaylist) {

    throw new ExistsError("Playlist already exists");
  }
  await db.run(`INSERT INTO playlists (id, private, username, playlistname) VALUES (?, ?, ?, ?)`, [playlistId, isPrivate, username, playlistname]);
}


export async function getUserPlaylists(db: Database, username: string): Promise<{ id: string, private: boolean, playlistname: string }[]> {
  const user = await db.get(`SELECT username FROM users WHERE username = ?`, [username]);

  if (!user) {
    throw new UserNotFoundError(username);
  }

  const playlists = await db.all<{ id: string, private: boolean, playlistname: string }[]>(`
    SELECT id, private, playlistname FROM playlists WHERE username = ?
  `, [username]);
  return playlists;
}

export async function deletePlaylist(db: Database, playlistId: string, username: string): Promise<void> {
  const existingPlaylist = await db.get(`SELECT id FROM playlists WHERE id = ? AND username = ?`, [playlistId, username]);
  if (!existingPlaylist) {

    throw new ExistsError("Could not find playlist");
  }
  else {
    await db.run(`DELETE FROM playlists WHERE id = ? AND username = ?`, [playlistId, username]);
  }
}

export async function getAllUsers(db: Database): Promise<{ username: string }[]> {
  return db.all<{ username: string }[]>(`SELECT username FROM users`);
}

export async function getAllPlaylists(db: Database): Promise<{ id: string, private: boolean, username: string }[]> {
  return db.all<{ id: string, private: boolean, username: string }[]>(`SELECT id, private, username, playlistname FROM playlists`);
}



