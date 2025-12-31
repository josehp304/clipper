import React from 'react';
import { Youtube, Sparkles, ArrowRight } from 'lucide-react';

interface LandingPageProps {
    url: string;
    setUrl: (url: string) => void;
    handleAnalyze: () => void;
    loading: boolean;
    error: string;
    user: any;
}

export default function LandingPage({
    url,
    setUrl,
    handleAnalyze,
    loading,
    error,
    user
}: LandingPageProps) {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center relative overflow-hidden">

            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-900/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[128px] pointer-events-none" />

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center items-center w-full max-w-5xl px-4 z-10 pt-20 pb-32">

                {/* Badge */}
                <div className="mb-8 animate-fade-in-up">
                    <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-xl">
                        <Sparkles className="w-3 h-3 text-violet-400" />
                        <span>AI-Powered Video Segmentation</span>
                    </span>
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-7xl font-sans font-bold text-center mb-6 tracking-tight leading-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                    Turn long videos into <br className="hidden md:block" />
                    <span className="text-white">viral clips</span> with AI magic.
                </h1>

                <p className="text-lg md:text-xl text-zinc-400 text-center max-w-2xl mb-12 leading-relaxed">
                    The fastest way to repurpose your content. Automatically detect, crop, and caption the best moments from your YouTube videos.
                </p>

                {/* Input Card */}
                <div className="w-full max-w-2xl bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-2 pl-4 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 transition focus-within:ring-2 focus-within:ring-violet-500/50 focus-within:border-violet-500/50">
                    <input
                        type="text"
                        placeholder="Paste a YouTube link here..."
                        className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none h-12 md:h-14 px-2"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !url}
                        className="bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 md:py-0 rounded-xl font-bold transition flex items-center justify-center gap-2 min-w-[160px]"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                Generate <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-6 text-red-400 bg-red-950/30 border border-red-900/50 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {error}
                    </div>
                )}

            </div>

            {/* Footer / Social Proof placeholder */}
            <div className="w-full border-t border-zinc-900 py-8 text-center text-zinc-600 text-sm">
                <p>Built for creators, by creators.</p>
            </div>

        </div>
    );
}
