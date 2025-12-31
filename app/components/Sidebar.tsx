import React from 'react';
import { History, Plus, Trash2, LogIn } from 'lucide-react';
import { UserButton, SignInButton } from '@clerk/nextjs';

interface Project {
    id: string;
    name: string;
    createdAt: string;
    // include other properties if needed for display
}

interface SidebarProps {
    projects: Project[];
    activeProjectId: string | null;
    loadProject: (id: string) => void;
    deleteProject: (id: string, e: React.MouseEvent) => void;
    resetProject: () => void;
    isLoaded: boolean;
    isSignedIn: boolean | undefined;
    user: any;
    className?: string;
    onClose?: () => void;
}

export default function Sidebar({
    projects,
    activeProjectId,
    loadProject,
    deleteProject,
    resetProject,
    isLoaded,
    isSignedIn,
    user,
    className = 'w-72 sticky top-0',
    onClose
}: SidebarProps) {
    return (
        <aside className={`bg-zinc-950 border-r border-zinc-800 h-screen overflow-y-auto flex-shrink-0 ${className}`}>
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2 text-white">
                    <History className="w-5 h-5 text-violet-500" /> History
                </h2>
                <button
                    onClick={() => {
                        resetProject();
                        onClose?.();
                    }}
                    className="p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition"
                    title="New Analysis"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Auth Section in Sidebar */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
                {isLoaded && (
                    isSignedIn ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <UserButton afterSignOutUrl="/" />
                                <div className="overflow-hidden">
                                    <p className="text-sm font-semibold truncate text-zinc-200">{user.fullName || user.username}</p>
                                    <p className="text-xs text-zinc-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <SignInButton mode="modal">
                            <button className="w-full flex items-center justify-center gap-2 bg-white text-black p-3 rounded-xl hover:bg-zinc-200 transition font-bold shadow-sm">
                                <LogIn className="w-4 h-4" /> Sign In
                            </button>
                        </SignInButton>
                    )
                )}
            </div>

            <div className="p-4 space-y-2">
                {projects.length === 0 ? (
                    <p className="text-zinc-600 text-sm text-center py-8">No saved projects yet</p>
                ) : (
                    projects.map(p => (
                        <div
                            key={p.id}
                            onClick={() => {
                                loadProject(p.id);
                                onClose?.();
                            }}
                            className={`group p-3 rounded-xl cursor-pointer transition relative border ${activeProjectId === p.id ? 'bg-zinc-900 border-zinc-700' : 'border-transparent hover:bg-zinc-900/50 hover:border-zinc-800'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="overflow-hidden">
                                    <p className={`font-semibold text-sm truncate ${activeProjectId === p.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                                        {p.name}
                                    </p>
                                    <p className="text-xs text-zinc-600 mt-1">
                                        {new Date(p.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => deleteProject(p.id, e)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
}
