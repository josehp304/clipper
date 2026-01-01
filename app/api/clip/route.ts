
import { NextResponse } from 'next/server';
import { parseTime } from '@/lib/time';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { url, clip, transcript, editingClip } = body;

        const start = parseTime(clip.start_time);
        const end = parseTime(clip.end_time);

        const videoId = new URL(url).searchParams.get('v') || new URL(url).pathname.slice(1);

        const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8000';

        // Filter captions based on time range
        const captions = transcript.filter((t: any) => {
            const tStart = t.start;
            const tEnd = t.start + t.duration;
            // Check overlap
            return tEnd > start && tStart < end;
        });

        // Prepare payload for worker
        const stylizedClip = editingClip || clip;
        const payload = {
            video_id: videoId,
            start_time: start,
            end_time: end,
            aspect_ratio: clip.aspect_ratio || "16:9",
            video_quality: clip.video_quality || "1080p",
            captions: captions,
            caption_style: {
                fontSize: stylizedClip.fontSize || 24,
                fontColor: stylizedClip.fontColor || '#FFFFFF',
                bgColor: stylizedClip.bgColor || '#000000'
            }
        };
        console.log("hi1")
        const response = await fetch(`${workerUrl}/clip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.log("hi")
            console.log(errorText)
            return NextResponse.json({ error: `Worker error: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error generating clip:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
