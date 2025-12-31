import React from 'react';
import { Scissors, Youtube, AlertCircle } from 'lucide-react';

interface UrlInputSectionProps {
    url: string;
    setUrl: (url: string) => void;
    loading: boolean;
    handleAnalyze: () => void;
    error: string;
}

export default function UrlInputSection({
    url,
    setUrl,
    loading,
    handleAnalyze,
    error
}: UrlInputSectionProps) {
    return (
        <div>
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-extrabold text-blue-600 mb-2 flex justify-center items-center gap-2">
                    <Scissors className="w-10 h-10" /> YouTube Clipper
                </h1>
                <p className="text-gray-600">Academic MVP for AI-Driven Video Segmentation</p>
            </header>

            <section className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Paste YouTube URL here..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !url}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Analyzing...' : <><Youtube className="w-5 h-5" /> Analyze</>}
                    </button>
                </div>
                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> {error}
                    </div>
                )}
            </section>
        </div>
    );
}
