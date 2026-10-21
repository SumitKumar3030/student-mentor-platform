import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { sessionsApi } from "@/lib/api";
import { toast } from "sonner";
import { LogOut, Video, Users, Copy, Loader2, X } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuthStore();

  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdSession, setCreatedSession] = useState<{
    id: string;
    code: string;
    joinToken: string;
  } | null>(null);

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const session = await sessionsApi.create(user.id, "javascript", 60);
      setCreatedSession({
        id: session.id,
        code: session.code,
        joinToken: session.joinToken,
      });
      setShowShareModal(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create session"));
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!user) return;
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      toast.error("Enter a valid 6-digit code");
      return;
    }

    setJoining(true);
    try {
      const session = await sessionsApi.resolve(code);
      const result = await sessionsApi.join(session.id, user.id);
      toast.success("Joined session");
      navigate(`/room/${result.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to join session"));
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

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Top nav */}
      <nav className="border-b border-neutral-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-xl font-bold">
            <span className="text-white">Code</span>
            <span className="text-violet-400">Mentor</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400">
              {profile?.name || user?.email}
            </span>
            <button
              onClick={async () => {
                await signOut();
                navigate("/login");
              }}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-neutral-400">
            Start a new session or join one with a code.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Start a session */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 hover:border-violet-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
              <Video className="text-violet-400" size={24} />
            </div>
            <h2 className="text-xl font-semibold mb-2">Start a Session</h2>
            <p className="text-neutral-400 text-sm mb-6">
              You'll become the mentor. Get a code + link to share with your
              student.
            </p>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Generate Session"
              )}
            </button>
          </div>

          {/* Join a session */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 hover:border-violet-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
              <Users className="text-violet-400" size={24} />
            </div>
            <h2 className="text-xl font-semibold mb-2">Join a Session</h2>
            <p className="text-neutral-400 text-sm mb-6">
              You'll become the student. Enter the 6-digit code from your
              mentor.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="flex-1 px-3 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-center text-lg tracking-[0.3em] font-mono focus:outline-none focus:border-violet-500 transition-colors"
                maxLength={6}
              />
              <button
                onClick={handleJoin}
                disabled={joining || code.length !== 6}
                className="px-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {joining ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Join"
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Share modal */}
      {showShareModal && createdSession && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-neutral-800 rounded-lg"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-semibold mb-1">Session ready!</h3>
            <p className="text-neutral-400 text-sm mb-6">
              Share with your student so they can join.
            </p>

            {/* Link */}
            <div className="mb-4">
              <label className="block text-xs text-neutral-400 mb-2 font-medium">
                🔗 LINK
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={joinLink}
                  className="flex-1 px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm font-mono truncate"
                />
                <button
                  onClick={() => copyToClipboard(joinLink, "Link")}
                  className="px-3 bg-violet-600 hover:bg-violet-500 rounded-lg"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {/* Code */}
            <div className="mb-6">
              <label className="block text-xs text-neutral-400 mb-2 font-medium">
                🔢 CODE
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={createdSession.code}
                  className="flex-1 px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-center text-xl tracking-[0.4em] font-mono font-semibold"
                />
                <button
                  onClick={() => copyToClipboard(createdSession.code, "Code")}
                  className="px-3 bg-violet-600 hover:bg-violet-500 rounded-lg"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate(`/room/${createdSession.id}`)}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium"
            >
              Enter Room →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
