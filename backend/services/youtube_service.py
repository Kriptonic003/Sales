import os
import requests

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
COMMENTS_URL = "https://www.googleapis.com/youtube/v3/commentThreads"


def search_top_videos(query: str, max_videos: int = 3):
    """
    Search YouTube for top-viewed videos related to a query
    """
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "order": "viewCount",
        "maxResults": max_videos,
        "key": YOUTUBE_API_KEY,
    }

    resp = requests.get(SEARCH_URL, params=params)
    resp.raise_for_status()

    items = resp.json().get("items", [])
    return [item["id"]["videoId"] for item in items]


def fetch_comments_for_video(video_id: str, max_comments: int = 20):
    """
    Fetch top-level comments for a single video
    """
    params = {
        "part": "snippet",
        "videoId": video_id,
        "maxResults": max_comments,
        "textFormat": "plainText",
        "key": YOUTUBE_API_KEY,
    }

    resp = requests.get(COMMENTS_URL, params=params)
    resp.raise_for_status()

    comments = []
    for item in resp.json().get("items", []):
        snippet = item["snippet"]["topLevelComment"]["snippet"]
        comments.append({
            "text": snippet["textDisplay"],
            "published_at": snippet["publishedAt"],
        })

    return comments


def fetch_comments_from_top_videos(query: str, max_videos: int = 3):
    """
    Fetch comments from multiple top-viewed videos
    """
    all_comments = []
    video_ids = search_top_videos(query, max_videos)

    for vid in video_ids:
        comments = fetch_comments_for_video(vid)
        all_comments.extend(comments)

    return all_comments
