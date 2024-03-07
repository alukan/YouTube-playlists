import express, { Request, Response } from 'express';
import { Database } from 'sqlite';
import {
  initializeDatabase, addUser, addPlaylist, getUserPlaylists,
  deletePlaylist, getAllUsers, getAllPlaylists, checkUser
} from './database';
import { UserNotFoundError, ExistsError } from './types/Errors';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(express.json());

const corsOptions = {
  origin: 'http://localhost:3000',
};

app.use(cors(corsOptions));

let db: Database;

initializeDatabase().then(database => {
  db = database;
  console.log('Database initialized');

  app.listen(3001, () => {
    console.log(`Server running on http://localhost:3001`);
  });
});






// Endpoints about users

app.get('/userExists/:username', async (req: Request, res: Response) => {
  const { username } = req.params;
  try {
    await checkUser(db, username);
    res.status(200).send({ message: 'User exists' });
  } catch (error) {
    if (error instanceof ExistsError) {
      res.status(404).send({ error: error.message });
    }
    else {
      res.status(500).send({ error: "Failed to fetch users" });
    }
  }
});

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
  const { username } = req.body;
  try {
    await addUser(db, username);
    res.status(201).send({ message: 'User added successfully' });
  } catch (error) {
    if (error instanceof ExistsError) {
      res.status(404).send({ error: error.message });
    }
    else {
      res.status(500).send({ error: 'Error adding user' });
    }
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


app.post('/user/:username/playlists', async (req, res) => {
  const { username } = req.params;
  const { fromUser } = req.body;
  
  try {
    const playlists = await getUserPlaylists(db, username);
    const playlistArray = [];
    for (const playlist of playlists) {
      if (fromUser === username || !playlist.private) {
        playlistArray.push({ name: playlist.playlistname, id: playlist.id });
      }
    }
    res.status(200).json(playlistArray);
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
  const { username, isPrivate, playlistName } = req.body;
  const response = await axios.post('https://youtube.thorsteinsson.is/api/playlists', {
    name: playlistName
  });
  const playlistId = response.data.id;
  try {
    await addPlaylist(db, username, playlistId, isPrivate, playlistName);
    res.send({ message: "Playlist added successfully." });
  } catch (error) {
    console.error("Failed to add playlist:", error);
    if (error instanceof UserNotFoundError) {
      res.status(404).send({ error: error.message });
    }
    else if (error instanceof ExistsError) {
      res.status(404).send({ error: error.message });
    }
    else {
      res.status(500).send({ error: "Failed to add playlist" });
    }
  }
});

export interface VideoFromSearch {
  id: {
    videoId: string;
  };
  title: string;
  description: string;
  snippet: {
    thumbnails: {
      url: string
    }
  }
}

app.delete('/user/:username/playlist/:id', async (req, res) => {
  const username = req.params.username;
  const id = req.params.id;

  if (!username) {
    return res.status(400).send({ error: "Username is required" });
  }

  try {
    await deletePlaylist(db, id, username as string);
    res.status(200).send({ message: "Playlist deleted successfully." });
  } catch (error) {
    console.error("Failed to delete playlist:", error);
    if (error instanceof ExistsError) {
      res.status(404).send({ error: error.message });
    }
    else {
      res.status(500).send({ error: "Failed to delete playlist" });
    }
  }
});


