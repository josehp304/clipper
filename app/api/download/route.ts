
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const file = req.nextUrl.searchParams.get('file');

    if (!file) {
        return NextResponse.json({ error: 'File parameter is required' }, { status: 400 });
    }

    try {
        const workerUrl = process.env.WORKER_URL || 'http://localhost:8000';
        const fileUrl = `${workerUrl}/download/${file}`;

        const workerResponse = await fetch(fileUrl);

        if (!workerResponse.ok) {
            return NextResponse.json({ error: 'File not found on worker' }, { status: 404 });
        }

        // Stream the response back to client
        return new NextResponse(workerResponse.body, {
            headers: {
                'Content-Type': 'video/mp4',
                'Content-Disposition': `attachment; filename="${file}"`,
            },
        });

    } catch (error) {
        console.error("Proxy Download Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
