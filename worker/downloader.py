import yt_dlp
import os

def download_video(video_id: str, output_dir: str = "downloads", quality: str = "1080p") -> str:
    """
    Downloads a YouTube video using yt-dlp.
    Returns the path to the downloaded video file.
    quality: e.g., "1080p", "720p", "480p", "360p"
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    url = f"https://www.youtube.com/watch?v={video_id}"
    
    # Extract height number from quality string (e.g., "1080p" -> 1080)
    try:
        height = int(quality.replace('p', ''))
    except ValueError:
        height = 1080 # Default fallback
        
    # Suffix filename with quality to avoid collision if different qualities are requested
    output_template = os.path.join(output_dir, f"{video_id}_{quality}.%(ext)s")
    
    # yt-dlp format string: Best video with height <= X + Best Audio
    format_str = f'bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/best[height<={height}][ext=mp4]/best'
    
    ydl_opts = {
        'format': format_str,
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info_dict)
        
    return filename

def download_audio(video_id: str, output_dir: str = "downloads") -> str:
    """
    Downloads the audio of a YouTube video using yt-dlp.
    Returns the path to the downloaded audio file.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    url = f"https://www.youtube.com/watch?v={video_id}"
    # Download best audio, prefer m4a for compatibility
    output_template = os.path.join(output_dir, f"{video_id}.%(ext)s")
    
    ydl_opts = {
        'format': 'bestaudio[ext=m4a]/bestaudio',
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info_dict)
        
    return filename
