import os
import requests


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"


def generate_chat_response(message: str) -> str:
    if not GEMINI_API_KEY:
        return (
            "Gemini API key is not configured on the server. "
            "Set GEMINI_API_KEY in the environment to enable AI chat."
        )

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                            "You are an AI assistant specialized in sales analytics and sentiment analysis. "
                            "Explain insights in clear business language.\n\nUser question:\n" + message
                        )
                    }
                ]
            }
        ]
    }
    try:
        resp = requests.post(
            GEMINI_ENDPOINT,
            params={"key": GEMINI_API_KEY},
            json=payload,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )
        return text or "I could not generate a detailed answer right now."
    except Exception as exc:
        return f"Error talking to Gemini API: {exc}"


