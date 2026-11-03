import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { sessionsApi } from "@/lib/api";
import { toast } from "sonner";
import {
  LogOut,
  Video,
  Users,
  Copy,
  Loader2,
  X,
  Play,
  Clock,
  Settings,
  LayoutDashboard,
  History,
  Plus,
  Calendar,
  CheckCircle2,
  MonitorPlay,
  Menu,
  Sparkles,
} from "lucide-react";
import PairPulseLogo from "@/components/PairPulseLogo";

type HistorySession = {
  id: string;
  title: string;
  code: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  role: string;
  mentorName: string;
  studentName: string | null;
  recording: { share_token: string; duration_seconds: number } | null;
  aiSummary: string | null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuthStore();

  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState("");

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdSession, setCreatedSession] = useState<{
    id: string;
    code: string;
    joinToken: string;
  } | null>(null);

  // Sidebar & History State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    totalRecordings: 0,
    role: "Student",
  });
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      try {
        const data = await sessionsApi.history(user.id);
        setHistory(data.sessions);
        setStats(data.stats);
      } catch {
        console.error("Failed to load history");
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [user]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!sessionTitle.trim())
      return toast.error("Please enter a session title");

    setCreating(true);
    try {
      const session = await sessionsApi.create(
        user.id,
        sessionTitle,
        "javascript",
        60,
      );
      setCreatedSession({
        id: session.id,
        code: session.code,
        joinToken: session.joinToken,
      });
      setShowCreateModal(false);
      setShowShareModal(true);
      setSessionTitle("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create session",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!user) return;
    if (code.length !== 6 || !/^\d+$/.test(code))
      return toast.error("Enter a valid 6-digit code");

    setJoining(true);
    try {
      const session = await sessionsApi.resolve(code);
      const result = await sessionsApi.join(session.id, user.id);
      toast.success("Joined session");
      navigate(`/room/${result.id}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to join session",
      );
    } finally {
      setJoining(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const joinLink = createdSession
    ? `${window.location.origin}/join/${createdSession.code}`
    : "";
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* 📱 MOBILE SIDEBAR OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 💻 SIDEBAR (Desktop & Mobile) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PairPulseLogo className="w-8 h-8" />
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              PairPulse
            </span>
          </div>
          <button
            className="md:hidden p-1 text-slate-400"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 space-y-1">
          <div className="px-3 pb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Workspace
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-[#FF5722] flex items-center justify-center text-white font-bold shadow-sm">
                {profile?.name?.charAt(0) || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {profile?.name || "User"}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-brand-50 text-brand-600 rounded-lg text-sm font-semibold transition-colors">
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
            <History size={18} /> History
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
            <Settings size={18} /> Settings
          </button>
        </div>

        {/* App Quote */}
        <div className="p-4 mx-4 mb-4 bg-slate-50 rounded-xl border border-slate-100">
          <Sparkles className="text-brand-500 mb-2" size={20} />
          <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
            "Code together. Learn faster. Build the future."
          </p>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={async () => {
              await signOut();
              navigate("/login");
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* 🚀 MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Top Navbar (Desktop & Mobile) */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3 md:gap-0">
            <button
              className="md:hidden p-2 -ml-2 text-slate-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <PairPulseLogo className="w-6 h-6" />
              <span className="font-bold text-slate-900">PairPulse</span>
            </div>
            <h1 className="hidden md:block text-xl font-bold text-slate-900">
              {greeting}, {profile?.name?.split(" ")[0] || "there"} 👋
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
            >
              <Plus size={16} />{" "}
              <span className="hidden md:inline">Start Session</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-slate-500 mb-3">
                  <div className="p-1.5 bg-blue-50 rounded-md text-blue-600">
                    <Video size={16} />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">
                    Total Sessions
                  </span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-slate-900">
                  {stats.totalSessions}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-slate-500 mb-3">
                  <div className="p-1.5 bg-purple-50 rounded-md text-purple-600">
                    <Clock size={16} />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">
                    Time Spent
                  </span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-slate-900">
                  {Math.floor(stats.totalMinutes / 60)}h{" "}
                  {stats.totalMinutes % 60}m
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-slate-500 mb-3">
                  <div className="p-1.5 bg-orange-50 rounded-md text-orange-600">
                    <MonitorPlay size={16} />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">
                    Recordings
                  </span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-slate-900">
                  {stats.totalRecordings}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-slate-500 mb-3">
                  <div className="p-1.5 bg-green-50 rounded-md text-green-600">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">
                    Account
                  </span>
                </div>
                <p className="text-lg md:text-xl font-bold text-slate-900 mt-1">
                  {stats.role}
                </p>
              </div>
            </div>

            {/* Premium Hero Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Join Session Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                    <Users size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    Join a Session
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Enter the 6-digit code shared by your mentor to join the
                    live room.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    className="flex-1 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl tracking-[0.3em] font-mono text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                    maxLength={6}
                  />
                  <button
                    onClick={handleJoin}
                    disabled={joining || code.length !== 6}
                    className="px-6 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all shadow-md shadow-brand-500/20"
                  >
                    {joining ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      "Join"
                    )}
                  </button>
                </div>
              </div>

              {/* Create Session Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl group-hover:bg-brand-500/30 transition-colors" />
                <div>
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 text-white backdrop-blur-md border border-white/10">
                    <Video size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Become a Mentor
                  </h3>
                  <p className="text-sm text-slate-400 mb-6">
                    Create a room, share your screen, and start teaching with AI
                    assistance.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full py-3.5 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-sm"
                >
                  Create Session
                </button>
              </div>
            </div>

            {/* History Box */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col h-[400px] shadow-sm">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <h3 className="font-bold text-slate-900">Recent Sessions</h3>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  {history.length} total
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {loadingHistory ? (
                  <div className="h-full flex items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="animate-spin" size={18} /> Loading
                    history...
                  </div>
                ) : history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Calendar size={32} className="mb-3 opacity-50" />
                    <p className="text-sm font-medium">
                      No past sessions found.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((session) => (
                      <div
                        key={session.id}
                        className="group flex flex-col md:flex-row md:items-start justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100 gap-4"
                      >
                        <div className="flex items-start gap-4 w-full">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1 ${session.role === "mentor" ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-500"}`}
                          >
                            {session.role === "mentor" ? (
                              <Video size={18} />
                            ) : (
                              <Users size={18} />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between md:justify-start gap-3 mb-1">
                              <p className="font-bold text-slate-900 text-sm">
                                {session.title}
                              </p>
                              {session.status === "active" ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                                  Live
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  Ended
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mb-2">
                              <span>
                                {new Date(
                                  session.startedAt,
                                ).toLocaleDateString()}
                              </span>
                              <span>•</span>
                              <span
                                className={
                                  session.role === "mentor"
                                    ? "text-brand-600 font-semibold"
                                    : "font-semibold"
                                }
                              >
                                {session.role}
                              </span>
                              <span>•</span>
                              <span>
                                {session.role === "mentor"
                                  ? `Student: ${session.studentName || "None"}`
                                  : `Mentor: ${session.mentorName}`}
                              </span>
                            </div>

                            {/* AI Summary Box */}
                            {session.aiSummary && (
                              <div className="mt-3 p-3 bg-gradient-to-r from-brand-50 to-white border border-brand-100 rounded-xl">
                                <div className="flex items-center gap-1.5 text-brand-600 text-[10px] font-bold uppercase tracking-wider mb-1">
                                  <Sparkles size={12} /> AI Summary
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                  {session.aiSummary}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex items-center gap-2 pl-14 md:pl-0">
                          {session.role === "mentor" && session.recording && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/watch/${session.recording?.share_token}`,
                                )
                              }
                              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                            >
                              <Play size={12} /> Watch
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* APP INFO & FEATURE HIGHLIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Video size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              HD Video Calling
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Peer-to-peer WebRTC video with screen sharing.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">AI Copilot</h4>
            <p className="text-xs text-slate-500 mt-1">
              Groq-powered code explanations and session summaries.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0">
            <MonitorPlay size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Instant Recording
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Capture your screen and share instantly via link.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="pt-8 pb-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2 mb-1">
            <PairPulseLogo className="w-5 h-5" />
            <span className="text-sm font-bold text-slate-900">PairPulse</span>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} PairPulse. All rights reserved.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <a href="#" className="hover:text-brand-600 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-brand-600 transition-colors">
            Terms of Service
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-900 transition-colors"
          >
            GitHub
          </a>
        </div>

        <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            An IP by
          </span>
          <img
            src="/itspossible-logo.png"
            alt="It'sPossible ip"
            className="h-5 object-contain grayscale hover:grayscale-0 transition-all"
          />
        </div>
      </footer>
          </div>
        </div>
      </main>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mb-6">
              <Video className="text-brand-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Start a new session
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Give your session a name so you can find it in your history later.
            </p>
            <form onSubmit={handleCreateSubmit}>
              <input
                type="text"
                autoFocus
                placeholder="e.g. React Hooks Debugging"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl mb-6 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-900 font-medium placeholder:text-slate-400 transition-all"
              />
              <button
                type="submit"
                disabled={creating || !sessionTitle.trim()}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded-xl font-bold flex justify-center items-center text-white transition-all shadow-lg shadow-brand-500/20"
              >
                {creating ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Create Session"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && createdSession && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Session ready!
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Share with your student to join.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] text-slate-500 mb-2 font-bold uppercase tracking-wider">
                Join Link
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={joinLink}
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono truncate text-slate-600"
                />
                <button
                  onClick={() => copyToClipboard(joinLink, "Link")}
                  className="px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[11px] text-slate-500 mb-2 font-bold uppercase tracking-wider">
                Session Code
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={createdSession.code}
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl tracking-[0.4em] font-mono font-bold text-slate-900"
                />
                <button
                  onClick={() => copyToClipboard(createdSession.code, "Code")}
                  className="px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate(`/room/${createdSession.id}`)}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 rounded-xl font-bold text-white transition-all shadow-lg shadow-brand-500/20"
            >
              Enter Room →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
