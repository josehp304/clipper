import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Clipper',
    default: 'Clipper - AI Video Repurposing',
  },
  description: 'Transform long-form videos into engaging shorts with AI. Features automated highlights, smart cropping, and dynamic captions.',
  keywords: ['AI video editor', 'video repurposing', 'content creation', 'automated clips', 'captions', 'shorts', 'reels', 'tiktok'],
  authors: [{ name: 'Clipper Team' }],
  openGraph: {
    title: 'Clipper - AI Video Repurposing',
    description: 'Transform long-form videos into engaging shorts with AI. Features automated highlights, smart cropping, and dynamic captions.',
    type: 'website',
    siteName: 'Clipper',
    locale: 'en_US',
    images: [{
      url: 'https://res.cloudinary.com/dgxkgtq5c/image/upload/v1767294992/clipperog_qjtqf4.jpg',
      width: 1200,
      height: 630,
      alt: 'Clipper - AI Video Repurposing',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clipper - AI Video Repurposing',
    description: 'Transform long-form videos into engaging shorts with AI.',
    images: ['https://res.cloudinary.com/dgxkgtq5c/image/upload/v1767294992/clipperog_qjtqf4.jpg'],
  },
};

import { ClerkProvider } from '@clerk/nextjs'

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
          <Toaster richColors position="bottom-right" theme="dark" />
        </body>
      </html>
    </ClerkProvider>
  );
}
