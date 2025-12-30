'use client';

import { useState } from 'react';
import { UploadCloud, Youtube, Scissors, Play, AlertCircle, ChevronLeft, Layout, Clock, Check, History, Plus, Trash2, LogIn, UserCircle, RefreshCcw, X } from 'lucide-react';
import { useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUser, UserButton, SignInButton } from '@clerk/nextjs';
import { syncClerkUserToFirestore, saveProjectToFirestore } from '@/lib/sync-utils';

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [clips, setClips] = useState<any[]>([]);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [processingClip, setProcessingClip] = useState<string | null>(null);
  const [generatedClipUrl, setGeneratedClipUrl] = useState<string | null>(null);
  const [editingClip, setEditingClip] = useState<any | null>(null);
  const [viewingClip, setViewingClip] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Persistent Storage State
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    const saved = localStorage.getItem('clipper_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProjects(parsed);
      } catch (e) {
        console.error('Failed to parse saved projects', e);
      }
    }
  }, []);

  // Save projects on change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('clipper_projects', JSON.stringify(projects));
    }
  }, [projects]);

  const loadProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setActiveProjectId(project.id);
      setUrl(project.url);
      setClips(project.clips || []);
      setTranscript(project.transcript || []);
      setGeneratedClipUrl(null);
      setEditingClip(null);
    }
  };

  const deleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = projects.filter(p => p.id !== projectId);
    setProjects(updated);
    localStorage.setItem('clipper_projects', JSON.stringify(updated));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      setClips([]);
      setTranscript([]);
    }
  };

  // Sync user to Firestore when logged in
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      syncClerkUserToFirestore(user).catch(console.error);
    }
  }, [isLoaded, isSignedIn, user]);

  const syncAllProjects = async () => {
    if (!isSignedIn || !user) return;
    setLoading(true);
    try {
      for (const project of projects) {
        if (!project.userId) {
          const synced = { ...project, userId: user.id };
          await saveProjectToFirestore(synced);
        } else {
          await saveProjectToFirestore(project);
        }
      }
      // Update local state to reflect all are now synced
      setProjects(prev => prev.map(p => ({ ...p, userId: user.id })));
      alert("All projects successfully synced to Firebase!");
    } catch (e) {
      console.error("Failed to sync projects", e);
      alert("Failed to sync some projects.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setClips([]);
    setGeneratedClipUrl(null); // Reset generated clip

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze video');
      }

      const newClips = (data.clips || []).map((c: any) => ({ ...c, id: uuidv4() }));
      setClips(newClips);
      setTranscript(data.transcript || []);

      const newProject = {
        id: uuidv4(),
        userId: isSignedIn ? user.id : null,
        name: `Analysis: ${new URL(url).searchParams.get('v') || 'Video'}`,
        url: url,
        clips: newClips,
        transcript: data.transcript || [],
        createdAt: new Date().toISOString()
      };

      setProjects(prev => [newProject, ...prev]);
      setActiveProjectId(newProject.id);

      if (isSignedIn) {
        saveProjectToFirestore(newProject).catch(console.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (clip: any) => {
    setProcessingClip(clip.title);
    setGeneratedClipUrl(null);

    try {
      const parseTime = (timeStr: string) => {
        if (typeof timeStr === 'number') return timeStr;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
      };

      const start = parseTime(clip.start_time);
      const end = parseTime(clip.end_time);

      const videoId = new URL(url).searchParams.get('v') || new URL(url).pathname.slice(1);

      const response = await fetch('http://localhost:8000/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: videoId,
          start_time: start,
          end_time: end,
          aspect_ratio: clip.aspect_ratio || "16:9",
          captions: transcript.filter((t: any) => {
            const tStart = t.start;
            const tEnd = t.start + t.duration;
            // Check overlap
            return tEnd > start && tStart < end;
          }),
          caption_style: {
            fontSize: (editingClip || clip).fontSize || 24,
            fontColor: (editingClip || clip).fontColor || '#FFFFFF',
            bgColor: (editingClip || clip).bgColor || '#000000'
          }
        })
      });

      const data = await response.json();
      if (data.url) {
        setGeneratedClipUrl(data.url);

        // Update clip in persistent storage
        setProjects(prev => prev.map(p => {
          if (p.id === activeProjectId) {
            return {
              ...p,
              clips: p.clips.map((c: any) =>
                (c.id === clip.id || c.title === clip.title) ? { ...c, url: data.url, ...editingClip } : c
              )
            };
          }
          return p;
        }));

        if (isSignedIn) {
          // Find the updated project to save
          const updatedProject = projects.find(p => p.id === activeProjectId);
          if (updatedProject) {
            // Need to apply the same update manually here because state update is async
            const syncedProject = {
              ...updatedProject,
              clips: updatedProject.clips.map((c: any) =>
                (c.id === clip.id || c.title === clip.title) ? { ...c, url: data.url, ...editingClip } : c
              )
            };
            saveProjectToFirestore(syncedProject).catch(console.error);
          }
        }

        setEditingClip(null); // Close editor after generation

        // Update local clips state immediately
        setClips(prev => prev.map(c =>
          (c.id === clip.id || c.title === clip.title) ? { ...c, url: data.url, ...editingClip } : c
        ));

        // Open the detail view
        setViewingClip({ ...clip, url: data.url, ...editingClip });
      }
    } catch (e) {
      alert('Failed to connect to worker. Is it running?');
    } finally {
      setProcessingClip(null);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 h-screen overflow-y-auto flex-shrink-0 sticky top-0">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" /> History
          </h2>
          <button
            onClick={() => {
              setActiveProjectId(null);
              setUrl('');
              setClips([]);
              setTranscript([]);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="New Analysis"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Section in Sidebar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          {isLoaded && (
            isSignedIn ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <UserButton afterSignOutUrl="/" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate">{user.fullName || user.username}</p>
                    <p className="text-xs text-gray-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
                  </div>
                </div>

              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition font-semibold shadow-sm">
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
              </SignInButton>
            )
          )}
        </div>

        <div className="p-4 space-y-2">
          {projects.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No saved projects yet</p>
          ) : (
            projects.map(p => (
              <div
                key={p.id}
                onClick={() => loadProject(p.id)}
                className={`group p-3 rounded-xl cursor-pointer transition relative ${activeProjectId === p.id ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50 border border-transparent'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div className="overflow-hidden">
                    <p className={`font-semibold text-sm truncate ${activeProjectId === p.id ? 'text-blue-700' : 'text-gray-700'}`}>
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteProject(p.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-extrabold text-blue-600 mb-2 flex justify-center items-center gap-2">
              <Scissors className="w-10 h-10" /> YouTube Clipper
            </h1>
            <p className="text-gray-600">Academic MVP for AI-Driven Video Segmentation</p>
          </header>

          <section className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex gap-4">
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

          {editingClip ? (
            <section className="bg-white rounded-xl shadow-lg p-8 mb-8 overflow-hidden">
              <button
                onClick={() => setEditingClip(null)}
                className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ChevronLeft className="w-5 h-5" /> Back to Suggestions
              </button>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Video Editor</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                      <div className="flex gap-4">
                        {['16:9', '9:16', '1:1'].map(ratio => (
                          <button
                            key={ratio}
                            onClick={() => setEditingClip({ ...editingClip, aspect_ratio: ratio })}
                            className={`flex-1 py-2 rounded-lg border-2 transition flex items-center justify-center gap-2 ${editingClip.aspect_ratio === ratio || (!editingClip.aspect_ratio && ratio === '16:9')
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <Layout className="w-4 h-4" /> {ratio}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                        <input
                          type="text"
                          value={editingClip.start_time}
                          onChange={(e) => setEditingClip({ ...editingClip, start_time: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                        <input
                          type="text"
                          value={editingClip.end_time}
                          onChange={(e) => setEditingClip({ ...editingClip, end_time: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Caption Style</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Font Size</label>
                          <input
                            type="number"
                            min="12"
                            max="72"
                            value={editingClip.fontSize || 24}
                            onChange={e => setEditingClip({ ...editingClip, fontSize: parseInt(e.target.value) })}
                            className="w-full border border-gray-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Text Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={editingClip.fontColor || '#FFFFFF'}
                              onChange={e => setEditingClip({ ...editingClip, fontColor: e.target.value })}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <span className="text-xs text-gray-400 font-mono">{editingClip.fontColor || '#FFFFFF'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Background Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={editingClip.bgColor || '#000000'}
                              onChange={e => setEditingClip({ ...editingClip, bgColor: e.target.value })}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <span className="text-xs text-gray-400 font-mono">{editingClip.bgColor || '#000000'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleGenerate(editingClip)}
                      disabled={!!processingClip}
                      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center items-center gap-3 shadow-lg hover:shadow-xl"
                    >
                      {processingClip ? (
                        'Processing Clip...'
                      ) : (
                        <><Play className="w-5 h-5" /> Generate Final Video</>
                      )}
                    </button>
                  </div>
                </div>

                <div className="border-l pl-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" /> Transcript
                    </h3>
                  </div>
                  <input
                    type="text"
                    placeholder="Search transcript..."
                    className="w-full border border-gray-300 rounded mb-4 px-3 py-2 text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <div className="h-[400px] overflow-y-auto pr-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {transcript
                      .filter((t: any) => t.text.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg text-sm cursor-pointer transition relative group ${(() => {
                            const parse = (t: any) => {
                              if (typeof t === 'number') return t;
                              const parts = t.toString().split(':').map(Number);
                              return parts.length === 2 ? parts[0] * 60 + parts[1] : (parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : 0);
                            };
                            return item.start >= parse(editingClip.start_time) && item.start <= parse(editingClip.end_time);
                          })()
                            ? 'bg-blue-100 border-l-4 border-blue-600'
                            : 'hover:bg-gray-50'
                            }`}
                          onClick={() => {
                            const time = Math.floor(item.start);
                            const parse = (t: any) => {
                              if (typeof t === 'number') return t;
                              const parts = t.toString().split(':').map(Number);
                              return parts.length === 2 ? parts[0] * 60 + parts[1] : (parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : 0);
                            };
                            const currentStart = parse(editingClip.start_time);
                            const currentEnd = parse(editingClip.end_time);

                            // Intelligent Range Selection
                            if (time < currentStart || (currentStart === 0 && currentEnd === 0)) {
                              // Clicking before start (or clean slate) -> Update Start
                              setEditingClip({ ...editingClip, start_time: formatTime(time) });
                            } else {
                              const endTime = Math.floor(item.start + item.duration);
                              setEditingClip({ ...editingClip, end_time: formatTime(endTime) });
                            }
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="font-mono text-blue-600 mr-2 min-w-[50px] inline-block">[{formatTime(item.start)}]</span>
                              {item.text}
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 flex gap-2 ml-4 self-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingClip({ ...editingClip, start_time: formatTime(Math.floor(item.start)) });
                                }}
                                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-semibold border border-green-200"
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
                                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 font-semibold border border-red-200"
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
          ) : (
            <>
              {generatedClipUrl && (
                <section className="bg-white rounded-xl shadow-lg p-8 mb-8">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Play className="w-6 h-6 text-green-600" /> Generated Clip
                  </h2>
                  <div className="aspect-[16/9] max-w-2xl mx-auto bg-black rounded-lg overflow-hidden shadow-xl">
                    <video controls src={generatedClipUrl} className="w-full h-full object-contain" />
                  </div>
                  <div className="mt-6 flex justify-center">
                    <a
                      href={generatedClipUrl.replace('/clips/', '/download/')}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <UploadCloud className="w-5 h-5" /> Download Clip
                    </a>
                  </div>
                </section>
              )}

              {clips.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-6">Suggested Clips</h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {clips.map((clip, idx) => (
                      <div key={idx} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-xl transition relative group">

                        {/* Thumbnail View if processed */}
                        {clip.url ? (
                          <div
                            className="aspect-video bg-black rounded-lg mb-4 overflow-hidden relative cursor-pointer"
                            onClick={() => setViewingClip(clip)}
                          >
                            <video src={clip.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <Play className="w-12 h-12 text-white" />
                            </div>
                          </div>
                        ) : null}

                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-gray-800">{clip.title}</h3>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-mono">
                            {clip.start_time} - {clip.end_time}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-6 text-sm italic">"{clip.reason}"</p>

                        {!clip.url && (
                          <button
                            onClick={() => setEditingClip({ ...clip, aspect_ratio: '16:9' })}
                            disabled={!!processingClip}
                            className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-black transition flex justify-center items-center gap-2"
                          >
                            <Scissors className="w-4 h-4" /> Edit & Generate
                          </button>
                        )}
                        {clip.url && (
                          <button
                            onClick={() => setViewingClip(clip)}
                            className="w-full bg-blue-50 text-blue-700 py-2 rounded-lg hover:bg-blue-100 transition flex justify-center items-center gap-2 font-semibold"
                          >
                            <Play className="w-4 h-4" /> View Result
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Detailed Clip View Modal */}
          {viewingClip && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setViewingClip(null)}>
              <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-lg">{viewingClip.title}</h3>
                  <button onClick={() => setViewingClip(null)} className="p-2 hover:bg-gray-200 rounded-full transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid md:grid-cols-3">
                  <div className="md:col-span-2 bg-black flex items-center justify-center h-[50vh] md:h-[600px]">
                    <video controls src={viewingClip.url} className="max-w-full max-h-full" autoPlay />
                  </div>
                  <div className="p-6 space-y-6 bg-white overflow-y-auto h-[50vh] md:h-[600px]">
                    <div>
                      <h4 className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-2">Clip Info</h4>
                      <p className="text-sm text-gray-700 italic mb-2">"{viewingClip.reason}"</p>
                      <div className="flex gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-mono">
                          {viewingClip.start_time} - {viewingClip.end_time}
                        </span>
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-mono">
                          {viewingClip.aspect_ratio || '16:9'}
                        </span>
                      </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="space-y-3">
                      <a
                        href={viewingClip.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition flex justify-center items-center gap-2 font-semibold"
                      >
                        <UploadCloud className="w-5 h-5" /> Download
                      </a>

                      <button
                        onClick={() => {
                          setViewingClip(null);
                          setEditingClip(viewingClip);
                        }}
                        className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition flex justify-center items-center gap-2 font-semibold"
                      >
                        <Scissors className="w-5 h-5" /> Trim / Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main >
  );
}
