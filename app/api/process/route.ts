import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Extract Video ID
        let videoId = '';
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com')) {
                videoId = urlObj.searchParams.get('v') || '';
            } else if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.slice(1);
            }
        } catch (e) {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        if (!videoId) {
            return NextResponse.json({ error: 'Could not extract Video ID' }, { status: 400 });
        }

        // 1. Send to Worker
        console.log(`Sending request to worker for ${videoId}...`);

        try {
            const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8000';
            const workerResponse = await fetch(`${workerUrl}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ video_id: videoId }),
            });

            if (!workerResponse.ok) {
                const errorText = await workerResponse.text();
                throw new Error(`Worker Error: ${workerResponse.status} - ${errorText}`);
            }

            const data = await workerResponse.json();
            return NextResponse.json(data);

        } catch (e: any) {
            console.error('Worker Connection Error:', e);
            return NextResponse.json({
                error: 'Failed to process video. Ensure worker is running on port 8000.'
            }, { status: 502 });
        }

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
