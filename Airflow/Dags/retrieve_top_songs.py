from airflow.hooks.postgres_hook import PostgresHook
from datetime import datetime
import requests
from better_profanity import profanity
import json
import boto3
from airflow.decorators import dag, task
from airflow.utils.dates import days_ago
import os
import time

profanity.load_censor_words()

# env vars
bucket_name = os.environ['BUCKET_NAME']
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
)
spotify_client_id = os.environ['SPOTIFY_CLIENT_ID']
spotify_client_secret = os.environ['SPOTIFY_CLIENT_SECRET']
SP_DC = os.environ['SP_DC']
openai_token = os.environ['OPENAI_TOKEN']

def upload_image_to_s3(image_url, object_name):
    try:
        response = requests.get(image_url, stream=True)
        response.raise_for_status()
        s3_client.upload_fileobj(response.raw, bucket_name, object_name)
    except Exception as e:
        print(f"Error uploading {image_url} to {bucket_name}/{object_name}: {e}")
        return False
    return True

def update_song_images(song_id, idx, image_values, postgres_hook):
    for image_idx, image_value in enumerate(image_values, 1):
        update_sql = f"""
            UPDATE songs
            SET lyric_{idx}_image_{image_idx} = %s
            WHERE id = %s;
        """
        params = (image_value, song_id)
        postgres_hook.run(update_sql, parameters=params)

def get_popular_songs_with_lyrics():
    # Step 1 - Get top songs from Spotify API
    postgres_hook = PostgresHook(postgres_conn_id='Lyristrator_Postgres')
    url = 'https://accounts.spotify.com/api/token'
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    payload = {
        'grant_type': 'client_credentials',
    }
    response = requests.post(url, headers=headers, data=payload, auth=(spotify_client_id, spotify_client_secret))
    response.raise_for_status()
    access_token = response.json()['access_token']
    url = 'https://api.spotify.com/v1/playlists/37i9dQZEVXbLRQDuF5jeBp/tracks'  # Spotify's Top 50 USA playlist
    headers = {
        'Authorization': f'Bearer {access_token}',
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()

    # Step 2 - Get lyrics for each song
    token_url = 'https://open.spotify.com/get_access_token?reason=transport&productType=web_player'
    lyrics_api_url = 'https://spclient.wg.spotify.com/color-lyrics/v2/track/{trackid}?format=json&market=from_token'

    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36',
        'App-platform': 'WebPlayer',
        'content-type': 'text/html; charset=utf-8',
        'cookie': f'sp_dc={SP_DC};'
    }
    access_token = requests.get(token_url, headers=headers, timeout=60, verify=False).json()['accessToken']

    headers = {
        'Authorization': f'Bearer {access_token}',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36',
        'App-platform': 'WebPlayer'
    }
    
    songs_with_lyrics = []
    for item in response.json()['items']:
        track = item['track']
        track_id = track['id']
        track_name = track['name']
        artist_name = track['artists'][0]['name']
        album_name = track['album']['name']
        
        lyrics_response = requests.get(
            lyrics_api_url.format(trackid=track_id),
            headers=headers
        )
        if lyrics_response.status_code == 200:
            lyrics_content = lyrics_response.json()['lyrics']
            lyrics = ""
            if 'lines' in lyrics_content:
                for line in lyrics_content['lines']:
                    if 'words' in line:
                        lyrics += line['words'] + '\n'
        else:
            lyrics = "No Lyrics"
        
        if lyrics != 'No Lyrics':
            songs_with_lyrics.append({
                'track_id': track_id,
                'track_name': track_name,
                'artist_name': artist_name,
                'album_name': album_name,
                'lyrics': lyrics,
                'censored_lyrics': profanity.censor(lyrics)
            })
            
            if len(songs_with_lyrics) >= 10:
                break
    
    # insert songs with lyrics into songs table (skip dups), refresh the chart table with today's top songs
    ranking = 1
    postgres_hook.run("TRUNCATE chart;")
    for song in songs_with_lyrics:
    
        sql = """
            INSERT INTO songs (id, artist, album, title, censored_lyrics, added_date)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING;
        """
        params = (
            song['track_id'],
            song['artist_name'],
            song['album_name'],
            song['track_name'],
            song['censored_lyrics'],
            datetime.now()
        )
        postgres_hook.run(sql, parameters=params)
        sql = """
            INSERT INTO chart (song_id, ranking)
            VALUES (%s, %s);
        """
        params = (
            song['track_id'],
            ranking
        )
        postgres_hook.run(sql, parameters=params)
        ranking = ranking + 1

    # Step 3 - Get the setting and top three lyrics for each song from the OpenAI Chat Completions API
    chat_completions_url = 'https://api.openai.com/v1/chat/completions'
    headers = {
        'Authorization': f'Bearer {openai_token}',
        'Content-Type': 'application/json',
    }
    
    sql = "SELECT id, censored_lyrics FROM songs WHERE setting IS NULL OR lyric_1 IS NULL OR lyric_2 IS NULL OR lyric_3 IS NULL;"
    songs_to_update = postgres_hook.get_records(sql)

    max_retries = 2
    for song in songs_to_update:
        song_id, censored_lyrics = song
        payload = {
            "model": "gpt-4",
            "messages": [
                {
                    "role": "system",
                    "content": "Given lyrics by the user, you provide a JSON-formatted list that includes the three most important lyrics that summarize and describe the entire song, as well as a 'setting' property with a short description like 'dark, eerie streets, 1800s London.' Return only the JSON, which should have four properties: lyric_1, lyric_2, lyric_3, and setting."
                },
                {
                    "role": "user",
                    "content": censored_lyrics
                }
            ]
        }
        retries = 0
        while retries <= max_retries:
            try:
                response = requests.post(chat_completions_url, headers=headers, json=payload)
                response.raise_for_status()
                response_data = json.loads(response.json()['choices'][0]['message']['content'])
                setting = response_data['setting']
                lyric_1 = response_data['lyric_1']
                lyric_2 = response_data['lyric_2']
                lyric_3 = response_data['lyric_3']
                break
            except (requests.RequestException, KeyError, json.JSONDecodeError) as e:
                print(f"Error occurred: {e}. Retrying...")
                retries += 1
                if retries == max_retries:
                    print(f"Failed to process song with ID {song_id} after {max_retries} retries.")
        
        update_sql = """
            UPDATE songs
            SET setting = %s, lyric_1 = %s, lyric_2 = %s, lyric_3 = %s
            WHERE id = %s;
        """
        params = (setting, lyric_1, lyric_2, lyric_3, song_id)
        postgres_hook.run(update_sql, parameters=params)
    
    # Step 4 - generate images for each lyric using the OpenAI Image Generations API
    # First fetch songs with populated setting and lyrics columns
    sql = f"""
        SELECT id, setting, lyric_1, lyric_2, lyric_3
        FROM songs
        WHERE
            setting IS NOT NULL AND
            lyric_1 IS NOT NULL AND 
            lyric_2 IS NOT NULL AND
            lyric_3 IS NOT NULL AND
            (
                lyric_1_image_1 IS NULL OR
                lyric_1_image_2 IS NULL OR
                lyric_1_image_3 IS NULL OR
                lyric_2_image_1 IS NULL OR
                lyric_2_image_2 IS NULL OR
                lyric_2_image_3 IS NULL OR
                lyric_3_image_1 IS NULL OR
                lyric_3_image_2 IS NULL OR
                lyric_3_image_3 IS NULL OR
                lyric_1_image_1 = 'https://{bucket_name}.s3.amazonaws.com/Image_Not_Available.png' OR
                lyric_1_image_2 = 'https://{bucket_name}.s3.amazonaws.com/Image_Not_Available.png' OR
                lyric_1_image_3 = 'https://{bucket_name}.s3.amazonaws.com/Image_Not_Available.png' OR
                lyric_2_image_1 = 'https://{bucket_name}.s3.amazonaws.com/Image_Not_Available.png' OR
                lyric_2_image_2 = 'https://{bucket_name}.s3.amazonaws.com/Image_Not_Available.png' OR
                lyric_2_image_3 = 'https://{bucket_name}.s3.amazonaws.com/Image_Not_Available.png' OR
                lyric_3_image_1 = 'https://{bucket_name}.s3.amazonaws.com/Image_Not_Available.png' OR
                lyric_3_image_2 = 'https://{bucket_name}.s3.amazonaws.com/Image_Not_Available.png' OR
                lyric_3_image_3 = 'https://{bucket_name}.s3.amazonaws.com/Image_Not_Available.png'
            );
    """
    songs = postgres_hook.get_records(sql)

    image_generations_endpoint = 'https://api.openai.com/v1/images/generations'
    
    headers = {
        'Authorization': f'Bearer {openai_token}',
        'Content-Type': 'application/json'
    }
    
    for song in songs:
        song_id, setting, lyric_1, lyric_2, lyric_3 = song
        for idx, lyric in enumerate([lyric_1, lyric_2, lyric_3], 1):
            payload = {
                "prompt": f"Style: Cinematic, Setting: {setting}, Scene: {lyric}",
                "n": 3,
                "size": "256x256"
            }
            response = requests.post(image_generations_endpoint, headers=headers, json=payload)
            response_data = response.json()

            print(response.json())

            # Insert images to S3 bucket, manage special cases
            if response.status_code == 200:
                image_values = []
                for img_idx, img in enumerate(response_data['data']):
                    image_url = img['url']
                    object_name = f"{song_id}/lyric_{idx}_image_{img_idx + 1}.png"
                    if upload_image_to_s3(image_url, object_name):
                        image_values.append(f"https://{bucket_name}.s3.amazonaws.com/{object_name}")
                    else:
                        print('Failed to upload image')
                update_song_images(song_id, idx, image_values, postgres_hook)


            elif response.status_code == 400 and response_data['error']['code'] == 'content_policy_violation':
                image_values = [f'https://{bucket_name}.s3.amazonaws.com/DALL·E_Content_Policy_Violation.png'] * 3
                update_song_images(song_id, idx, image_values, postgres_hook)

            elif response.status_code != 200:
                image_values = [f'https://{bucket_name}.s3.amazonaws.com/Image_Not_Available.png'] * 3
                update_song_images(song_id, idx, image_values, postgres_hook)

# double run to bypass rate limit of 50 images per minute (max is 9 x 10 = 90)
@task
def double_run():
    get_popular_songs_with_lyrics()
    time.sleep(300)
    get_popular_songs_with_lyrics()

@dag(schedule_interval='0 0,6,12,18 * * *', start_date=days_ago(2), catchup=False)
def spotify_lyrics_dag():
    double_run()

dag_instance = spotify_lyrics_dag()