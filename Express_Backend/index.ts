import express = require('express');
import bodyParser = require('body-parser');
import cors = require('cors');
import pgPromise = require('pg-promise');

// env var
const db_conn_string: string = process.env.DB_CONN_STRING as string;

const app = express();
const port: number = 3001;

const pgp = pgPromise();
const db = pgp(db_conn_string);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req: express.Request, res: express.Response) => res.sendStatus(200));

app.get(
    '/fetch',
    (req: express.Request, res: express.Response) => {
        db.any(`
            SELECT
                c.*,
                s.artist,
                s.album,
                s.title,
                s.setting,
                s.lyric_1,
                s.lyric_2,
                s.lyric_3,
                s.lyric_1_image_1,
                s.lyric_1_image_2,
                s.lyric_1_image_3,
                s.lyric_2_image_1,
                s.lyric_2_image_2,
                s.lyric_2_image_3,
                s.lyric_3_image_1,
                s.lyric_3_image_2,
                s.lyric_3_image_3
            FROM chart c JOIN songs s ON c.song_id = s.id
            ORDER BY c.ranking;
        `)
            .then(data => res.send(data))
            .catch(error => res.send(error))
    }
);

app.listen(port, () => console.log(`running on port ${port}.`));