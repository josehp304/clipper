import React from 'react';
import { ChevronLeft, Layout, Play, Clock } from 'lucide-react';
import { formatTime, parseTime } from '@/lib/time';

interface VideoEditorProps {
    editingClip: any;
    setEditingClip: (clip: any) => void;
    transcript: any[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    handleGenerate: (clip: any) => void;
    processingClip: string | null;
}

export default function VideoEditor({
    editingClip,
    setEditingClip,
    transcript,
    searchTerm,
    setSearchTerm,
    handleGenerate,
    processingClip
}: VideoEditorProps) {
    return (
        <section className="bg-zinc-900 rounded-xl shadow-lg p-8 mb-8 overflow-hidden border border-zinc-800">
            <button
                onClick={() => setEditingClip(null)}
                className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition"
            >
                <ChevronLeft className="w-5 h-5" /> Back to Suggestions
            </button>

            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-bold mb-4 text-white">Video Editor</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Aspect Ratio</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['16:9', '9:16', '1:1'].map(ratio => (
                                    <button
                                        key={ratio}
                                        onClick={() => setEditingClip({ ...editingClip, aspect_ratio: ratio })}
                                        className={`flex-1 py-2 rounded-lg border-2 transition flex items-center justify-center gap-2 font-medium ${editingClip.aspect_ratio === ratio || (!editingClip.aspect_ratio && ratio === '16:9')
                                            ? 'border-white bg-white text-black'
                                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                            }`}
                                    >
                                        <Layout className="w-4 h-4" /> {ratio}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Video Quality</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['1080p', '720p', '480p', '360p'].map(quality => (
                                    <button
                                        key={quality}
                                        onClick={() => setEditingClip({ ...editingClip, video_quality: quality })}
                                        className={`flex-1 py-2 rounded-lg border-2 transition flex items-center justify-center gap-2 font-medium text-sm ${editingClip.video_quality === quality || (!editingClip.video_quality && quality === '1080p')
                                            ? 'border-white bg-white text-black'
                                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                            }`}
                                    >
                                        {quality}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Start Time</label>
                                <input
                                    type="text"
                                    value={editingClip.start_time}
                                    onChange={(e) => setEditingClip({ ...editingClip, start_time: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">End Time</label>
                                <input
                                    type="text"
                                    value={editingClip.end_time}
                                    onChange={(e) => setEditingClip({ ...editingClip, end_time: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="border-t border-zinc-800 pt-4">
                            <label className="block text-sm font-medium text-zinc-400 mb-3">Caption Style</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 block mb-1">Font Size</label>
                                    <input
                                        type="number"
                                        min="12"
                                        max="72"
                                        value={editingClip.fontSize || 24}
                                        onChange={e => setEditingClip({ ...editingClip, fontSize: parseInt(e.target.value) })}
                                        className="w-full bg-zinc-950 border border-zinc-700 text-white rounded px-2 py-1 outline-none focus:ring-1 focus:ring-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 block mb-1">Text Color</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={editingClip.fontColor || '#FFFFFF'}
                                            onChange={e => setEditingClip({ ...editingClip, fontColor: e.target.value })}
                                            className="h-8 w-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                                        />
                                        <span className="text-xs text-zinc-500 font-mono">{editingClip.fontColor || '#FFFFFF'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 block mb-1">Background Color</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={editingClip.bgColor || '#000000'}
                                            onChange={e => setEditingClip({ ...editingClip, bgColor: e.target.value })}
                                            className="h-8 w-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                                        />
                                        <span className="text-xs text-zinc-500 font-mono">{editingClip.bgColor || '#000000'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleGenerate(editingClip)}
                            disabled={!!processingClip}
                            className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-zinc-200 transition flex justify-center items-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50"
                        >
                            {processingClip ? (
                                'Processing Clip...'
                            ) : (
                                <><Play className="w-5 h-5 fill-black" /> Generate Final Video</>
                            )}
                        </button>
                    </div>
                </div>

                <div className="border-l border-zinc-800 pl-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                            <Clock className="w-5 h-5 text-violet-500" /> Transcript
                        </h3>
                    </div>
                    <input
                        type="text"
                        placeholder="Search transcript..."
                        className="w-full bg-zinc-950 border border-zinc-700 text-white rounded mb-4 px-3 py-2 text-sm focus:border-violet-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="h-[400px] overflow-y-auto pr-4 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700">
                        {transcript
                            .filter((t: any) => t.text.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-lg text-sm cursor-pointer transition relative group ${(() => {
                                        return item.start >= parseTime(editingClip.start_time) && item.start <= parseTime(editingClip.end_time);
                                    })()
                                        ? 'bg-violet-900/20 border-l-4 border-violet-500 text-white'
                                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                        }`}
                                    onClick={() => {
                                        const time = Math.floor(item.start);
                                        const currentStart = parseTime(editingClip.start_time);
                                        const currentEnd = parseTime(editingClip.end_time);

                                        // Intelligent Range Selection
                                        if (time < currentStart || (currentStart === 0 && currentEnd === 0)) {
                                            setEditingClip({ ...editingClip, start_time: formatTime(time) });
                                        } else {
                                            const endTime = Math.floor(item.start + item.duration);
                                            setEditingClip({ ...editingClip, end_time: formatTime(endTime) });
                                        }
                                    }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <span className="font-mono text-violet-400 mr-2 min-w-[50px] inline-block">[{formatTime(item.start)}]</span>
                                            {item.text}
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 flex gap-2 ml-4 self-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingClip({ ...editingClip, start_time: formatTime(Math.floor(item.start)) });
                                                }}
                                                className="text-xs bg-zinc-800 text-green-400 px-2 py-1 rounded hover:bg-zinc-700 font-semibold border border-zinc-700"
                                                title="Set Start Time"
                                            >
                                                Start
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const endTime = Math.floor(item.start + item.duration);
                                                    setEditingClip({ ...editingClip, end_time: formatTime(endTime) });
                                                }}
                                                className="text-xs bg-zinc-800 text-red-400 px-2 py-1 rounded hover:bg-zinc-700 font-semibold border border-zinc-700"
                                                title="Set End Time"
                                            >
                                                End
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
