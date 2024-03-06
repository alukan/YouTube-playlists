// server.ts
import express, { Request, Response } from 'express';
import { Database } from 'sqlite';
import { initializeDatabase, addUser, addPlaylist, getUserPlaylists, deletePlaylist, getAllUsers, getAllPlaylists } from './database';
import { UserNotFoundError, PlaylistExistsError } from './types/Errors';

const app = express();
app.use(express.json());

let db: Database;

initializeDatabase().then(database => {
  db = database;
  console.log('Database initialized');

  app.listen(3000, () => {
    console.log(`Server running on http://localhost:3000`);
  });
});






// Endpoints about users
app.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers(db);
    res.status(200).json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    res.status(500).send({ error: "Failed to fetch users" });
  }
});


app.post('/user', async (req, res) => {
  console.log(req)
  const { username } = req.body;
  console.log(username)
  try {
    await addUser(db, username);
    res.status(200).send({ message: 'User added successfully' });
  } catch (error) {
    res.status(500).send({ error: 'Error adding user' });
  }
});






// Endpoints about playlists
app.get('/playlists', async (req: Request, res: Response) => {
  try {
    const playlists = await getAllPlaylists(db);
    res.status(200).json(playlists);
  } catch (error) {
    console.error("Failed to fetch playlists:", error);
    res.status(500).send({ error: "Failed to fetch playlists" });
  }
});


app.get('/user/:username/playlists', async (req, res) => {
  const { username } = req.params;
  try {
    const playlists = await getUserPlaylists(db, username);
    res.status(200).json(playlists);
  } catch (error) {
    console.error('Error fetching user playlists:', error);
    if (error instanceof UserNotFoundError) {
      res.status(404).send({ error: error.message });
    }
    else {
      res.status(500).send({ error: 'Could not fetch user playlists' });
    }
  }
});



app.post('/addPlaylist', async (req, res) => {
  const { username, playlistId, isPrivate } = req.body;

  try {
    await addPlaylist(db, username, playlistId, isPrivate);
    res.send({ message: "Playlist added successfully." });
  } catch (error) {
    console.error("Failed to add playlist:", error);
    if (error instanceof UserNotFoundError) {
      res.status(404).send({ error: error.message });
    }
    else if (error instanceof PlaylistExistsError) {
      res.status(404).send({ error: error.message });
    }
    else {
      res.status(500).send({ error: "Failed to add playlist" });
    }
  }
});



app.delete('/playlist/:id', async (req, res) => {
  const { id } = req.params;
  const { username } = req.query;

  if (!username) {
    return res.status(400).send({ error: "Username is required" });
  }

  try {
    await deletePlaylist(db, id, username as string);
    res.status(200).send({ message: "Playlist deleted successfully." });
  } catch (error) {
    console.error("Failed to delete playlist:", error);
    if (error instanceof PlaylistExistsError) {
      res.status(404).send({ error: error.message });
    }
    else {
      res.status(500).send({ error: "Failed to delete playlist" });
    }
  }
});
