import React from 'react';
import { X, UploadCloud, Scissors, Youtube } from 'lucide-react';

interface ClipDetailModalProps {
    viewingClip: any;
    setViewingClip: (clip: any) => void;
    setEditingClip: (clip: any) => void;
    handleUpload: (id: string, url: string, title: string) => void;
    isUploading: boolean;
}

export default function ClipDetailModal({
    viewingClip,
    setViewingClip,
    setEditingClip,
    handleUpload,
    isUploading
}: ClipDetailModalProps) {
    if (!viewingClip) return null;

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setViewingClip(null)}>
            <div className="bg-zinc-900 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl border border-zinc-800" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                    <h3 className="font-bold text-lg text-white">{viewingClip.title}</h3>
                    <button onClick={() => setViewingClip(null)} className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="grid md:grid-cols-3">
                    <div className="md:col-span-2 bg-black flex items-center justify-center h-[50vh] md:h-[600px] border-r border-zinc-800">
                        <video controls src={viewingClip.url} className="max-w-full max-h-full" autoPlay />
                    </div>
                    <div className="p-6 space-y-6 bg-zinc-900 overflow-y-auto h-[50vh] md:h-[600px]">
                        <div>
                            <h4 className="font-semibold text-zinc-500 text-xs uppercase tracking-wider mb-2">Clip Info</h4>
                            <p className="text-sm text-zinc-300 italic mb-2">"{viewingClip.reason}"</p>
                            <div className="flex gap-2">
                                <span className="bg-violet-900/30 border border-violet-800 text-violet-300 text-xs px-2 py-1 rounded font-mono">
                                    {viewingClip.start_time} - {viewingClip.end_time}
                                </span>
                                <span className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded font-mono">
                                    {viewingClip.aspect_ratio || '16:9'}
                                </span>
                            </div>
                        </div>

                        <hr className="border-zinc-800" />

                        <div className="space-y-3">
                            <a
                                href={viewingClip.url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-white text-black py-3 rounded-xl hover:bg-zinc-200 transition flex justify-center items-center gap-2 font-bold"
                            >
                                <UploadCloud className="w-5 h-5" /> Download
                            </a>

                            <button
                                onClick={() => handleUpload(viewingClip.id, viewingClip.url, viewingClip.title)}
                                disabled={isUploading}
                                className={`w-full py-3 rounded-xl hover:bg-red-900/40 transition flex justify-center items-center gap-2 font-semibold border ${isUploading ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-red-950/20 text-red-400 border-red-900/30'
                                    }`}
                            >
                                {isUploading ? 'Uploading...' : <><Youtube className="w-5 h-5" /> Upload to YouTube</>}
                            </button>

                            <button
                                onClick={() => {
                                    setViewingClip(null);
                                    setEditingClip(viewingClip);
                                }}
                                className="w-full bg-zinc-800 text-white py-3 rounded-xl hover:bg-zinc-700 transition flex justify-center items-center gap-2 font-semibold border border-zinc-700"
                            >
                                <Scissors className="w-5 h-5" /> Trim / Edit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
