import React, { useState, useEffect } from 'react';
import { SongType } from './types';
import Song from './Song';
import Header from './Header';

const App: React.FC = () => {
  const [songs, setSongs] = useState<SongType[]>([]);

  const fetchData = async () => {
    try {
      const response = await fetch('https://lyristrator.alecvanlandingham.com:8443/fetch');
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      const data = await response.json();
      setSongs(data);
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <Header />
      <br />
      <div className="container">
        <h2>Today's Top Songs (Spotify - US)</h2>
      </div>
      <div>
        {songs.map(song => (
          <Song key={song.song_id} song={song} />
        ))}
      </div>
    </>
  );
}

export default App;