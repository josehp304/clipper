import os
import json
from groq import Groq

# System prompt matching the original TypeScript version
SYSTEM_PROMPT = """
You are an expert video editor. Your task is to analyze a transcript from a YouTube video and identify 3-5 engaging, self-contained segments suitable for short-form content (TikTok/Reels).
Each segment must be between 20 and 60 seconds long.
You must output strictly raw JSON with no markdown formatting.
The JSON structure must be:
{
  "clips": [
    {
      "start_time": "MM:SS",
      "end_time": "MM:SS",
      "title": "Catchy Title",
      "reason": "Why this segment is engaging"
    }
  ]
}
"""

def get_groq_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set")
    return Groq(api_key=api_key)

async def analyze_transcript_chunk(transcript_text: str):
    """
    Analyzes a transcript chunk using Groq API to find engaging clips.
    """
    try:
        client = get_groq_client()
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": f"Analyze this transcript:\n\n{transcript_text}",
                }
            ],
            model="openai/gpt-oss-120b",
            temperature=0.5,
            response_format={"type": "json_object"},
        )

        content = chat_completion.choices[0].message.content
        if not content:
            return {"clips": []}

        return json.loads(content)
    except Exception as e:
        print(f"Groq API Error: {e}")
        return {"clips": []}
