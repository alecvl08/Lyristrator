create table songs(
	id text,
	artist text,
	album text,
	title text,
	added_date timestamp,
	censored_lyrics text,
	setting text,
	lyric_1 text,
	lyric_1_image_1 text,
	lyric_1_image_2 text,
	lyric_1_image_3 text,
	lyric_2 text,
	lyric_2_image_1 text,
	lyric_2_image_2 text,
	lyric_2_image_3 text,
	lyric_3 text,
	lyric_3_image_1 text,
	lyric_3_image_2 text,
	lyric_3_image_3 text
);

create table chart(
	song_id text,
	ranking numeric
);