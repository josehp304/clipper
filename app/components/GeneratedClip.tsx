import React from 'react';
import { Play, UploadCloud, Youtube } from 'lucide-react';

interface GeneratedClipProps {
    generatedClipUrl: string | null;
    onUpload: () => void;
    uploading: boolean;
    uploadSuccess: string | null;
}

export default function GeneratedClip({
    generatedClipUrl,
    onUpload,
    uploading,
    uploadSuccess
}: GeneratedClipProps) {
    if (!generatedClipUrl) return null;

    return (
        <section className="bg-zinc-900 rounded-xl shadow-xl p-8 mb-8 border border-zinc-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-blue-500" />

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                <Play className="w-6 h-6 text-violet-400" /> Your New Clip is Ready!
            </h2>

            <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="bg-black rounded-lg overflow-hidden shadow-2xl border border-zinc-800">
                    <video src={generatedClipUrl} controls className="w-full" />
                </div>

                <div className="space-y-4">
                    <a
                        href={generatedClipUrl.replace('/clips/', '/download/')}
                        className="w-full bg-white text-black py-4 rounded-xl hover:bg-zinc-200 transition flex justify-center items-center gap-3 font-bold shadow-lg"
                    >
                        <UploadCloud className="w-5 h-5" /> Download Video
                    </a>

                    <button
                        onClick={onUpload}
                        disabled={uploading}
                        className={`w-full py-4 rounded-xl font-bold transition flex justify-center items-center gap-3 border ${uploading ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-red-950/20 text-red-400 border-red-900/30 hover:bg-red-900/30'
                            }`}
                    >
                        {uploading ? 'Uploading to YouTube...' : <><Youtube className="w-5 h-5" /> Upload to YouTube</>}
                    </button>

                    {uploadSuccess && (
                        <p className="text-sm text-green-400 text-center mt-2 bg-green-900/20 py-2 rounded border border-green-900/30">
                            <a href={uploadSuccess} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-300">
                                Watch on YouTube
                            </a>
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
