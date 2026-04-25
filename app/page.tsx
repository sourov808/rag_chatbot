"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Inline Icons components to avoid dependency issues if lucide isn't fully loaded
const Icons = {
  Upload: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  ),
  Message: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Plus: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Send: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  File: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Loader: () => (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  ),
  Trash: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  ),
};

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function RagApp() {
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchCollections = useCallback(
    async (autoSelect = false) => {
      try {
        const res = await fetch("/api/collections");
        const data = await res.json();
        if (data.collections) {
          setCollections(data.collections);
          if (
            autoSelect &&
            data.collections.length > 0 &&
            !selectedCollection
          ) {
            setSelectedCollection(data.collections[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch collections", err);
      }
    },
    [selectedCollection],
  );

  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchCollections(true);
      initialFetchDone.current = true;
    }
  }, [fetchCollections]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName || !selectedFiles) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("collectionName", newCollectionName);
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("files", selectedFiles[i]);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type");
      if (res.ok && contentType?.includes("application/json")) {
        await fetchCollections();
        setSelectedCollection(newCollectionName);
        setMessages([]); // Clear history for the new collection
        setShowUploadModal(false);
        setNewCollectionName("");
        setSelectedFiles(null);
      } else {
        const errorText = await res.text();
        console.error("Upload failed:", errorText);
        alert(`Upload failed: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !selectedCollection || isAsking) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsAsking(true);

    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage,
          collectionName: selectedCollection,
          history: messages, // Send history for better conversational RAG
        }),
      });

      const contentType = res.headers.get("content-type");
      if (res.ok && contentType?.includes("application/json")) {
        const data = await res.json();
        if (data.data) {
          setMessages((prev) => [...prev, { role: "ai", content: data.data }]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "ai", content: "Sorry, I couldn't process that request." },
          ]);
        }
      } else {
        const errorText = await res.text();
        console.error("RAG failed:", errorText);
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: `Error: The server returned an unexpected response (${res.status}). Please check your connection and try again.`,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "An error occurred while fetching the response.",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleDropCollection = async (
    e: React.MouseEvent,
    collectionName: string,
  ) => {
    e.stopPropagation();
    if (
      !confirm(
        `Are you sure you want to delete '${collectionName}'? This action cannot be undone.`,
      )
    )
      return;

    try {
      const res = await fetch(`/api/collections?name=${collectionName}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedCollection === collectionName) {
          setSelectedCollection("");
          setMessages([]);
        }
        await fetchCollections();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete collection");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting collection");
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d0d] flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-xl tracking-tighter">
              R
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">RAG App</h1>
        </div>

        <div className="px-4 mb-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium transition-all hover:bg-zinc-800 dark:hover:bg-white active:scale-[0.98]"
          >
            <Icons.Plus />
            New Collection
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-2">
            Your Collections
          </div>
          <div className="space-y-1">
            {collections.map((col) => (
              <div key={col} className="group relative">
                <button
                  onClick={() => {
                    setSelectedCollection(col);
                    setMessages([]); // Clear history on collection change
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    selectedCollection === col
                      ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-100 dark:border-indigo-900/50 pr-10"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 pr-10"
                  }`}
                >
                  <Icons.File />
                  <span className="truncate">{col}</span>
                </button>
                <button
                  onClick={(e) => handleDropCollection(e, col)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete collection"
                >
                  <Icons.Trash />
                </button>
              </div>
            ))}
            {collections.length === 0 && (
              <div className="px-3 py-10 text-center text-zinc-400 text-sm">
                No collections yet.
                <br />
                Upload docs to start.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
            <div className="flex-1">
              <div className="text-xs font-medium truncate">Guest User</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#0d0d0d]/80 backdrop-blur-md flex items-center justify-center  px-8 z-10">
          <div className="flex items-center  gap-4">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg lg:hidden">
              <Icons.Message />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                Active Collection
              </div>
              <div className="text-lg font-bold flex items-center justify-center gap-2">
                {selectedCollection || "Select a Collection"}
                {selectedCollection && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse"></div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 opacity-70">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-indigo-600">
                <Icons.Message />
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                How can I help you today?
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400">
                Ask questions about the documents in your &quot;
                {selectedCollection}&quot; collection. I&apos;ll search for the
                most relevant information and provide a cited answer.
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-300`}
                >
                  <div
                    className={`flex gap-4 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                        m.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {m.role === "user" ? "U" : "AI"}
                    </div>
                    <div
                      className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm block whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-none font-light"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}
              {isAsking && (
                <div className="flex justify-start animate-pulse">
                  <div className="flex gap-4 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                      AI
                    </div>
                    <div className="px-5 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-none">
                      <div className="flex gap-1.5 py-1">
                        <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-8 bg-zinc-50 dark:bg-[#0a0a0a]">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleSendMessage}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all p-2 pr-3"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  selectedCollection
                    ? `Search in ${selectedCollection}...`
                    : "Please select or create a collection first"
                }
                disabled={!selectedCollection || isAsking}
                className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-4 min-h-[56px] max-h-[200px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 custom-scrollbar"
                rows={1}
              />
              <div className="flex items-center justify-between px-3 pb-2 pt-1 mt-1">
                <div className="flex gap-2">
                  <span className="text-[10px] text-zinc-400">
                    Press Enter to send
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || !selectedCollection || isAsking}
                  className="bg-indigo-600 text-white p-2.5 rounded-xl transition-all hover:bg-indigo-700 disabled:opacity-30 disabled:grayscale active:scale-95"
                >
                  {isAsking ? <Icons.Loader /> : <Icons.Send />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold tracking-tight">
                  Upload Documents
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors text-zinc-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-500 uppercase tracking-widest px-1">
                    Collection Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newCollectionName}
                    onChange={(e) =>
                      setNewCollectionName(
                        e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      )
                    }
                    placeholder="e.g. project_analysis"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-zinc-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-500 uppercase tracking-widest px-1">
                    Select Files
                  </label>
                  <div className="relative border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group">
                    <input
                      type="file"
                      multiple
                      required
                      onChange={(e) => setSelectedFiles(e.target.files)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        <Icons.Upload />
                      </div>
                      <div className="text-sm font-medium">
                        {selectedFiles
                          ? `${selectedFiles.length} files selected`
                          : "Drop files here or click to browse"}
                      </div>
                      <div className="text-xs text-zinc-500 uppercase tracking-tighter">
                        PDF, TXT, MD supported
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isUploading || !newCollectionName || !selectedFiles
                    }
                    className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-medium shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Icons.Loader />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Icons.Upload />
                        Start Ingestion
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}
