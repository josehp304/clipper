import yt_dlp
import os

def download_video(video_id: str, output_dir: str = "downloads") -> str:
    """
    Downloads a YouTube video using yt-dlp.
    Returns the path to the downloaded video file.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    url = f"https://www.youtube.com/watch?v={video_id}"
    output_template = os.path.join(output_dir, f"{video_id}.%(ext)s")
    
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info_dict)
        
    return filename
