import React, { useState, useEffect, useRef } from 'react';
import { SongType } from './types';
import Song from './Song';
import Header from './Header';

const App: React.FC = () => {
  const [songs, setSongs] = useState<SongType[]>([]);
  const modalToggleRef = useRef<HTMLButtonElement>(null);

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

    if (modalToggleRef.current) {
      modalToggleRef.current.click();
    }
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

      <button
        ref={modalToggleRef}
        type="button"
        className="btn btn-light"
        data-bs-toggle="modal"
        data-bs-target="#contentWarningModal"
        style={{ display: "none" }}
      >
        Open Modal
      </button>

      <div className="modal fade" id="contentWarningModal" tabIndex={-1} aria-labelledby="contentWarningModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="contentWarningModalLabel" style={{color: "black"}}>Disclaimer</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body" style={{color: "black"}}>
              The content on this page is auto-generated by AI with results that are not entirely predictable and thus may not reflect the views of the creator of this site, Alec VanLandingham, or even the musicians whose names are on this page. This page may also occasionally display content that is obscene or offensive and viewer discretion is advised.
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;