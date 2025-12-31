import React from 'react';
import { Play, Scissors, Youtube } from 'lucide-react';

interface ClipListProps {
    clips: any[];
    setViewingClip: (clip: any) => void;
    setEditingClip: (clip: any) => void;
    handleUpload: (id: string, url: string, title: string) => void;
    uploadingClipId: string | null;
    processingClip: string | null;
}

export default function ClipList({
    clips,
    setViewingClip,
    setEditingClip,
    handleUpload,
    uploadingClipId,
    processingClip
}: ClipListProps) {
    if (clips.length === 0) return null;

    return (
        <section>
            <h2 className="text-2xl font-bold mb-6 text-white">Suggested Clips</h2>
            <div className="grid gap-6 md:grid-cols-2">
                {clips.map((clip, idx) => {
                    const isUploading = uploadingClipId === clip.id;
                    return (
                        <div key={idx} className="bg-zinc-900 rounded-xl shadow-md p-6 border border-zinc-800 hover:shadow-2xl hover:border-zinc-700 transition relative group">

                            {/* Thumbnail View if processed */}
                            {clip.url ? (
                                <div
                                    className="aspect-video bg-black rounded-lg mb-4 overflow-hidden relative cursor-pointer"
                                    onClick={() => setViewingClip(clip)}
                                >
                                    <video src={clip.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <Play className="w-12 h-12 text-white" />
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white">{clip.title}</h3>
                                <span className="bg-violet-900/30 border border-violet-800 text-violet-300 text-xs px-2 py-1 rounded-full font-mono">
                                    {clip.start_time} - {clip.end_time}
                                </span>
                            </div>
                            <p className="text-zinc-400 mb-6 text-sm italic">"{clip.reason}"</p>

                            {!clip.url && (
                                <button
                                    onClick={() => setEditingClip({ ...clip, aspect_ratio: '16:9' })}
                                    disabled={!!processingClip}
                                    className="w-full bg-white text-black py-2 rounded-lg hover:bg-zinc-200 transition flex justify-center items-center gap-2 font-bold"
                                >
                                    <Scissors className="w-4 h-4" /> Edit & Generate
                                </button>
                            )}
                            {clip.url && (
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setViewingClip(clip)}
                                        className="w-full bg-violet-900/20 text-violet-300 py-2 rounded-lg hover:bg-violet-900/40 transition flex justify-center items-center gap-2 font-semibold border border-violet-900/50"
                                    >
                                        <Play className="w-4 h-4" /> View Result
                                    </button>
                                    <button
                                        onClick={() => handleUpload(clip.id, clip.url, clip.title)}
                                        disabled={isUploading}
                                        className={`w-full py-2 rounded-lg font-semibold transition flex justify-center items-center gap-2 border ${isUploading ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-red-950/20 text-red-400 border-red-900/30 hover:bg-red-900/30'
                                            }`}
                                    >
                                        {isUploading ? 'Uploading...' : <><Youtube className="w-4 h-4" /> Upload to YouTube</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
