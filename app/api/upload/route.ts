import { auth, clerkClient } from '@clerk/nextjs/server';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the OAuth token from Clerk using the Backend API
        // This allows retrieving the access token even if the session doesn't explicitly have it in the frontend cookie
        const client = await clerkClient();
        const clerkResponse = await client.users.getUserOauthAccessToken(userId, 'oauth_google');

        // Check if we have a token
        const token = clerkResponse.data.length > 0 ? clerkResponse.data[0].token : null;

        if (!token) {
            return NextResponse.json({ error: 'Failed to retrieve Google OAuth token. Please ensure you are signed in with Google and have granted permissions.' }, { status: 401 });
        }

        const { videoUrl, title, description } = await req.json();
        console.log({ videoUrl, title, description })
        if (!videoUrl) {
            return NextResponse.json({ error: 'Missing videoUrl' }, { status: 400 });
        }

        // Initialize the YouTube Data API client
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: token });

        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client,
        });

        // Fetch the video content as a stream
        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok) {
            throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
        }

        // We need to convert the web stream to a Node.js stream for googleapis
        const videoStream = videoResponse.body; // In Next.js (Node runtime), this might need handling, but fetch in Node env returns a compatible stream or we might need `Readable.fromWeb`.
        // Actually, native fetch in Node 18+ returns a web stream. googleapis might expect a Node stream.
        // Let's ensure compatibility.

        // @ts-ignore - Readable.fromWeb is available in Node 18+ but Typescript might complain depending on version
        const nodeStream = typeof (videoStream as any).pipe === 'function' ? videoStream : require('stream').Readable.fromWeb(videoStream);


        const response = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: {
                snippet: {
                    title: title || 'New Video',
                    description: description || 'Uploaded via Clipper',
                },
                status: {
                    privacyStatus: 'public', // Default to private for safety
                },
            },
            media: {
                body: nodeStream,
            },
        });

        return NextResponse.json({
            success: true,
            videoId: response.data.id,
            videoUrl: `https://www.youtube.com/watch?v=${response.data.id}`
        });

    } catch (error: any) {
        console.error('YouTube upload error:', error);

        if (error.code === 403 || (error.message && error.message.includes('insufficient authentication scopes'))) {
            return NextResponse.json({
                error: 'Insufficient permissions. Please ensure you have added the "https://www.googleapis.com/auth/youtube.upload" scope in your Clerk Dashboard > Social Connections > Google, and then Sign Out and Sign In again to grant the permission.'
            }, { status: 403 });
        }

        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
