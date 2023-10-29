"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var pgPromise = require("pg-promise");
// env var
var db_conn_string = process.env.DB_CONN_STRING;
var app = express();
var port = 3001;
var pgp = pgPromise();
var db = pgp(db_conn_string);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', function (req, res) { return res.sendStatus(200); });
app.get('/fetch', function (req, res) {
    db.any("\n            SELECT\n                c.*,\n                s.artist,\n                s.album,\n                s.title,\n                s.setting,\n                s.lyric_1,\n                s.lyric_2,\n                s.lyric_3,\n                s.lyric_1_image_1,\n                s.lyric_1_image_2,\n                s.lyric_1_image_3,\n                s.lyric_2_image_1,\n                s.lyric_2_image_2,\n                s.lyric_2_image_3,\n                s.lyric_3_image_1,\n                s.lyric_3_image_2,\n                s.lyric_3_image_3\n            FROM chart c JOIN songs s ON c.song_id = s.id\n            ORDER BY c.ranking;\n        ")
        .then(function (data) { return res.send(data); })
        .catch(function (error) { return res.send(error); });
});
app.listen(port, function () { return console.log("running on port ".concat(port, ".")); });
