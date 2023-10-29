import React from 'react';
import { SongType } from './types';
import LyricImagesCarousel from './LyricImagesCarousel';

interface SongProps {
  song: SongType;
}

const getRandomScrollInterval = () => {
  return Math.random() * (7000 - 3000) + 3000;
}

//Custom color gradient for metadata boxes
const getMetadataBoxBackgroundColor = (ranking: number) => {
  const darkPurple = { r: 80, g: 0, b: 120 };
  const lightPurple = { r: 200, g: 90, b: 220 };
  const r = darkPurple.r + (lightPurple.r - darkPurple.r) * ((ranking - 1) / 9);
  const g = darkPurple.g + (lightPurple.g - darkPurple.g) * ((ranking - 1) / 9);
  const b = darkPurple.b + (lightPurple.b - darkPurple.b) * ((ranking - 1) / 9);
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

const SongComponent: React.FC<SongProps> = ({ song }) => {

  const textStyle: React.CSSProperties = {
    color: "white"
  }

  const settingStyle: React.CSSProperties = {
    color: "rgb(246, 255, 110)"
  }

  return (
    <div className="container my-4">
      <div className="row align-items-end">
        
        {/* Song Metadata Box */}
        <div className="col-md-3 p-3 rounded" style={{ backgroundColor: getMetadataBoxBackgroundColor(song.ranking)}}>
          <h3 className="mb-1" style={textStyle}>{song.ranking} </h3>
          <h6 style={textStyle}>{song.artist} - "{song.title}"</h6>
          <h6 style={textStyle}><i>{song.album}</i></h6>
          <p><a className="btn btn-light" role="button" href={`https://open.spotify.com/track/${song.song_id}`}>Spotify</a></p>
          <br></br>
          <p style={settingStyle}><strong>Setting: </strong>{song.setting}</p>
        </div>
        {/* Three lyrics carousels */}
        <div className="col-md-3 mt-3">
          <LyricImagesCarousel 
            ranking={song.ranking}
            lyric_num={1}
            lyric={song.lyric_1}
            lyric_image_1={song.lyric_1_image_1}
            lyric_image_2={song.lyric_1_image_2}
            lyric_image_3={song.lyric_1_image_3}
            scroll_interval={getRandomScrollInterval()}
          ></LyricImagesCarousel>
        </div>
        <div className="col-md-3 mt-3">
          <LyricImagesCarousel 
            ranking={song.ranking}
            lyric_num={2}
            lyric={song.lyric_2}
            lyric_image_1={song.lyric_2_image_1}
            lyric_image_2={song.lyric_2_image_2}
            lyric_image_3={song.lyric_2_image_3}
            scroll_interval={getRandomScrollInterval()}
          ></LyricImagesCarousel>
        </div>
        <div className="col-md-3 mt-3">
          <LyricImagesCarousel 
            ranking={song.ranking}
            lyric_num={3}
            lyric={song.lyric_3}
            lyric_image_1={song.lyric_3_image_1}
            lyric_image_2={song.lyric_3_image_2}
            lyric_image_3={song.lyric_3_image_3}
            scroll_interval={getRandomScrollInterval()}
          ></LyricImagesCarousel>
        </div>
      </div>
    </div>
  );
}

export default SongComponent;
