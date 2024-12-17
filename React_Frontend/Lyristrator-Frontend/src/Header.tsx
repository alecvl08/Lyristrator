import React from 'react';

const Header: React.FC = () => {
  const headerStyle: React.CSSProperties = {
    backgroundColor: 'rgb(80, 0, 120)',
    color: 'white',
    padding: '20px 30px',
    textAlign: 'left'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2.5em',
    margin: 0
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1.2em',
    margin: '10px 0'
  };

  return (
    <div style={headerStyle}>
      <h1 style={titleStyle}>Lyristrator: AI-powered lyrics illustrator</h1>
      <p style={subtitleStyle}>How good is AI at illustrating popular song lyrics?</p>
      <p style={subtitleStyle}><strong>Attention: This page is no longer being updated due to changes to Spotify's Web API. See here for details: https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api</strong></p>
      <button type="button" className="btn btn-light" data-bs-toggle="modal" data-bs-target="#methodologyModal">
        Methodology
      </button>
      <p style={subtitleStyle}>By Alec VanLandingham</p>

      {/* The modal (pop-up window) with the Methodology info */}
      <div className="modal fade" id="methodologyModal" tabIndex={-1} aria-labelledby="methodologyModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="methodologyModalLabel" style={{color: "black"}}>Methodology</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body" style={{color: "black"}}>
              This page is populated in 4 steps:
              <ol>
                <li>The top songs on Spotify in the US are retrieved from the Spotify API.</li>
                <li>The lyrics of each song on Spotify are retrieved from another Spotify endpoint.</li>
                <li>
                    A prompt is submitted to the OpenAI Chat Completions API (GPT-4):
                    <br></br>
                    <br></br>
                    <i>
                        "Given lyrics by the user, you provide a JSON-formatted list that includes the three most important lyrics that summarize and describe the entire song, as well as a 'setting' property with a short description like 'dark, eerie streets, 1800s London.' Return only the JSON, which should have four properties: lyric_1, lyric_2, lyric_3, and setting."
                    </i>
                    <br></br>
                    <br></br>
                    This prompt is used to retrieve the "setting" and the three most important lyrics of the song.
                </li>
                <li>
                    For each lyric, the response from GPT-4 is submitted to the OpenAI Image Generations API (DALL·E):
                    <br></br>
                    <br></br>
                    <i>
                        "Style: Cinematic, Setting: [setting], Scene: [lyric]"
                    </i>
                    <br></br>
                    <br></br>
                    This generates three images for the lyric.
                </li>
              </ol>
              Technology stack:
              <ul>
                <li>Python + Apache Airflow - Task scheduling and main API request/data storage logic</li>
                <li>PostgreSQL - Song metadata storage</li>
                <li>AWS S3 - Image storage</li>
                <li>Express + TypeScript - App backend</li>
                <li>React + TypeScript + Vite - App frontend</li>
                <li>Bootstrap - CSS Framework (styling)</li>
                <li>Docker & Docker Compose - Containerization & container orchestration</li>
                <li>AWS EC2 - Deployment</li>
              </ul>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;