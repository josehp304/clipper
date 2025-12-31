'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@clerk/nextjs';
import { Menu, Scissors } from 'lucide-react';
import { syncClerkUserToFirestore, saveProjectToFirestore } from '@/lib/sync-utils';

import Sidebar from './components/Sidebar';
import UrlInputSection from './components/UrlInputSection';
import VideoEditor from './components/VideoEditor';
import GeneratedClip from './components/GeneratedClip';
import ClipList from './components/ClipList';
import ClipDetailModal from './components/ClipDetailModal';
import LandingPage from './components/LandingPage';
import { parseTime } from '@/lib/time';

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [clips, setClips] = useState<any[]>([]);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [processingClip, setProcessingClip] = useState<string | null>(null);
  const [generatedClipUrl, setGeneratedClipUrl] = useState<string | null>(null);
  const [generatedClipId, setGeneratedClipId] = useState<string | null>(null);
  const [editingClip, setEditingClip] = useState<any | null>(null);
  const [viewingClip, setViewingClip] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingClipId, setUploadingClipId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      setGeneratedClipId(null);
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

  const resetProject = () => {
    setActiveProjectId(null);
    setUrl('');
    setClips([]);
    setTranscript([]);
    setGeneratedClipUrl(null);
    setGeneratedClipId(null);
    setEditingClip(null);
  };

  // Sync user to Firestore when logged in
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      syncClerkUserToFirestore(user).catch(console.error);
    }
  }, [isLoaded, isSignedIn, user]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setClips([]);
    setGeneratedClipUrl(null); // Reset generated clip
    setGeneratedClipId(null);

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
    setGeneratedClipId(null);

    try {
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
        setGeneratedClipId(clip.id);

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

  const handleUpload = async (clipId: string, clipUrl: string, title?: string) => {
    if (!isSignedIn) {
      alert("Please sign in to upload to YouTube");
      return;
    }

    setUploadingClipId(clipId);
    setUploadSuccess(null);

    // Use a robust way to get title. If 'title' arg is missing, fallback.
    const finalTitle = title || `Clip from ${new URL(url).searchParams.get('v') || 'Video'}`;

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: clipUrl,
          title: finalTitle,
          description: `Created with Clipper from ${url}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadSuccess(data.videoUrl);
      alert(`Successfully uploaded to YouTube! URL: ${data.videoUrl}`);
    } catch (e: any) {
      console.error(e);
      alert(`Upload failed: ${e.message}`);
    } finally {
      setUploadingClipId(null);
    }
  };

  const showLanding = transcript.length === 0 && !activeProjectId;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black text-zinc-100 font-sans selection:bg-violet-900/30">
      {/* Mobile Header */}
      {!showLanding && (
        <header className="md:hidden bg-zinc-950 border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-20">
          <h1 className="font-bold text-lg flex items-center gap-2 text-white">
            <Scissors className="w-5 h-5 text-violet-500" /> Clipper
          </h1>
          <button onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-6 h-6 text-zinc-400" />
          </button>
        </header>
      )}

      {/* Desktop Sidebar */}
      <Sidebar
        className="hidden md:block w-72 sticky top-0 border-r border-zinc-800"
        projects={projects}
        activeProjectId={activeProjectId}
        loadProject={loadProject}
        deleteProject={deleteProject}
        resetProject={resetProject}
        isLoaded={isLoaded}
        isSignedIn={isSignedIn}
        user={user}
      />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <Sidebar
            className="absolute inset-y-0 left-0 w-3/4 max-w-sm z-50 shadow-2xl"
            projects={projects}
            activeProjectId={activeProjectId}
            loadProject={loadProject}
            deleteProject={deleteProject}
            resetProject={resetProject}
            isLoaded={isLoaded}
            isSignedIn={isSignedIn}
            user={user}
            onClose={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full relative">
        {showLanding ? (
          <>
            <button
              className="md:hidden absolute top-4 right-4 z-50 p-2 bg-zinc-900 rounded-lg text-zinc-400 border border-zinc-800"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <LandingPage
              url={url}
              setUrl={setUrl}
              handleAnalyze={handleAnalyze}
              loading={loading}
              error={error}
              user={user}
            />
          </>
        ) : (
          <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Project Workspace
              </h2>
              <button
                onClick={resetProject}
                className="text-sm text-zinc-500 hover:text-white transition flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800"
              >
                <Scissors className="w-4 h-4" /> Start New
              </button>
            </div>

            {generatedClipUrl && (
              <GeneratedClip
                generatedClipUrl={generatedClipUrl}
                onUpload={() => generatedClipId && handleUpload(generatedClipId, generatedClipUrl, `Clip from ${new URL(url).searchParams.get('v') || 'Video'}`)}
                uploading={!!(generatedClipId && uploadingClipId === generatedClipId)}
                uploadSuccess={uploadSuccess}
              />
            )}

            <div className="grid lg:grid-cols-1 gap-8">
              {editingClip ? (
                <VideoEditor
                  editingClip={editingClip}
                  setEditingClip={setEditingClip}
                  transcript={transcript}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  handleGenerate={handleGenerate}
                  processingClip={processingClip}
                />
              ) : null}

              <ClipList
                clips={clips}
                setViewingClip={setViewingClip}
                setEditingClip={setEditingClip}
                handleUpload={handleUpload}
                uploadingClipId={uploadingClipId}
                processingClip={processingClip}
              />
            </div>

            <ClipDetailModal
              viewingClip={viewingClip}
              setViewingClip={setViewingClip}
              setEditingClip={setEditingClip}
              handleUpload={handleUpload}
              isUploading={uploadingClipId === viewingClip?.id}
            />
          </div>
        )}
      </main>
    </div>
  );
}
