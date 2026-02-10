import os
import requests

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

if not YOUTUBE_API_KEY:
    raise RuntimeError("YOUTUBE_API_KEY not found in environment")

BASE_URL = "https://www.googleapis.com/youtube/v3/commentThreads"


def fetch_youtube_comments(video_id: str, max_results: int = 20):
    params = {
        "part": "snippet",
        "videoId": video_id,
        "key": YOUTUBE_API_KEY,
        "maxResults": max_results,
        "textFormat": "plainText",
    }

    response = requests.get(BASE_URL, params=params)
    response.raise_for_status()

    items = response.json().get("items", [])

    comments = []
    for item in items:
        snippet = item["snippet"]["topLevelComment"]["snippet"]
        comments.append({
            "author": snippet.get("authorDisplayName"),
            "text": snippet.get("textDisplay"),
            "published_at": snippet.get("publishedAt"),
        })

    return comments
