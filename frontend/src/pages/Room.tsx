import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore } from "@/store/roomStore";
import { sessionsApi, type SessionInfo } from "@/lib/api";
import { getLanguage } from "@/lib/languages";
import { getErrorMessage } from "@/lib/errors";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { toast } from "sonner";
import { Loader2, LogOut, Copy, Check } from "lucide-react";
import CodeEditor from "@/components/room/CodeEditor";
import LanguagePicker from "@/components/room/LanguagePicker";
import SessionTimer from "@/components/room/SessionTimer";
import VideoPanel from "@/components/room/VideoPanel";
import ChatPanel from "@/components/room/ChatPanel";
import { supabase } from "@/lib/supabase";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useAutoSnapshot } from "@/hooks/useAutoSnapshot";
import { connectSocket } from "@/lib/socket";
import { useRecording } from "@/hooks/useRecording";
import RecordingControls from "@/components/room/RecordingControls";


export default function Room() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { code, language, setCode, setLanguage } = useRoomStore();

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"mentor" | "student" | null>(null);
  const [copied, setCopied] = useState(false);

  const codeChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load session
  useEffect(() => {
    if (!sessionId || !user) return;

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .maybeSingle();

        if (error || !data) {
          toast.error("Session not found");
          navigate("/dashboard");
          return;
        }

        if (data.status !== "active") {
          toast.error("This session has ended");
          navigate("/dashboard");
          return;
        }

        if (data.mentor_id !== user.id && data.student_id !== user.id) {
          toast.error("You are not part of this session");
          navigate("/dashboard");
          return;
        }

        setSession({
          id: data.id,
          code: data.code,
          joinToken: data.join_token,
          mentorId: data.mentor_id,
          studentId: data.student_id,
          language: data.language,
          status: data.status,
          durationMinutes: data.duration_minutes,
          startedAt: data.started_at,
        });
        setRole(data.mentor_id === user.id ? "mentor" : "student");

        const lang = getLanguage(data.language);
        if (!useRoomStore.getState().code) {
          setCode(lang.defaultCode);
          useRoomStore.setState({ language: lang.id });
        }
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to load session"));
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [sessionId, user, navigate, setCode]);

const handleSessionEnded = useCallback(() => {
  toast.info('Session ended by mentor')
  navigate('/dashboard')
}, [navigate])

const { emitCodeChange, emitCursorMove, emitLanguageChange } = useRoomSocket({
  sessionId: sessionId || '',
  userId: user?.id || '',
  name: profile?.name || 'User',
  role: role || 'student',
  enabled: !!session && !!user && !!role,
  onSessionEnded: handleSessionEnded,
})

  const {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isCameraOff,
    isScreenSharing,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    permissionError,
  } = useWebRTC({
    sessionId: sessionId || "",
    role: role || "student",
    enabled: !!session && !!user && !!role,
  });

  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    error: recordingError,
  } = useRecording({
    sessionId: session?.id || "",
    userId: user?.id || "",
  });

  useAutoSnapshot(session?.id, !!session && !!role);

  // Auto-end when timer hits zero
  useEffect(() => {
    if (!session || role !== "mentor") return;

    const endAt =
      new Date(session.startedAt).getTime() +
      session.durationMinutes * 60 * 1000;

    const check = () => {
      if (Date.now() >= endAt) {
        toast.info("Session time is up");
        if (user) {
          sessionsApi.end(session.id, user.id, language, code).catch(() => {});
        }
        navigate("/dashboard");
      }
    };

    const interval = setInterval(check, 5000); // check every 5s
    return () => clearInterval(interval);
  }, [session, role, user, language, code, navigate]);

  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording().catch(() => {});
      }
    };
  }, [isRecording, stopRecording]);

  // Debounced code emit
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      if (codeChangeTimerRef.current) clearTimeout(codeChangeTimerRef.current);
      codeChangeTimerRef.current = setTimeout(() => {
        emitCodeChange(newCode);
      }, 150);
    },
    [setCode, emitCodeChange],
  );

  const handleCopyCode = () => {
    if (!session) return;
    navigator.clipboard.writeText(session.code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLanguageChange = (id: string) => {
    if (role !== "mentor") {
      toast.error("Only the mentor can change the language");
      return;
    }
    const lang = getLanguage(id);
    setLanguage(id);
    emitLanguageChange(id, lang.defaultCode);
    toast.success(`Switched to ${lang.label}`);
  };

  const handleStartRecording = async () => {
    if (!localStream || !remoteStream) {
      toast.error("Video not ready — wait for both users to connect");
      return;
    }
    if (role !== "mentor") {
      toast.error("Only the mentor can start recording");
      return;
    }
    await startRecording(localStream, remoteStream);
    toast.success("Recording started");
  };

  const handleStopRecording = async () => {
    toast.info("Stopping recording & uploading...");
    await stopRecording();
    if (!recordingError) {
      toast.success("Recording saved! View it in session history.");
    }
  };

  const handleEndSession = async () => {
    if (!session || !user) return;
    if (!confirm("End this session for everyone?")) return;

    try {
      await sessionsApi.end(session.id, user.id, language, code);

      // Notify the other user via socket
      const socket = connectSocket();
      socket.emit("session_ended", { sessionId: session.id });

      toast.success("Session ended");
      navigate("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to end session"));
    }
  };

  // Clear remote cursors only on true unmount
useEffect(() => {
  return () => {
    useRoomStore.getState().clearAllRemoteCursors()
  }
}, [])

  if (loading || !session || !user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="animate-spin text-violet-400 mx-auto mb-4"
          />
          <p className="text-neutral-400 text-sm">Loading session...</p>
        </div>
      </div>
    );
  }

  const monacoLang = getLanguage(language).monacoId;

  return (
    <div className="h-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden">
      <header className="h-14 flex items-center justify-between px-4 border-b border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-4">
          <div className="text-lg font-bold">
            <span className="text-white">Code</span>
            <span className="text-violet-400">Mentor</span>
          </div>

          <div className="h-6 w-px bg-neutral-800" />

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm font-mono transition-colors"
            title="Copy session code"
          >
            <span className="tracking-widest">{session.code}</span>
            {copied ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>

          <SessionTimer
            startedAt={session.startedAt}
            durationMinutes={session.durationMinutes}
          />

          {role === "mentor" && (
            <RecordingControls
              isRecording={isRecording}
              recordingDuration={recordingDuration}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              disabled={!localStream || !remoteStream || !isConnected}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded bg-violet-500/10 text-violet-300 uppercase font-semibold">
            {role}
          </span>

          {role === "mentor" && (
            <button
              onClick={handleEndSession}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
            >
              End Session
            </button>
          )}

          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            title="Leave room"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col border-r border-neutral-800">
          <div className="h-10 flex items-center justify-between px-3 border-b border-neutral-800 bg-neutral-900">
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
              <span>main.{getLanguage(language).extension}</span>
            </div>
            <LanguagePicker
              value={language}
              onChange={handleLanguageChange}
              disabled={role !== "mentor"}
            />
          </div>

          <div className="flex-1">
            <CodeEditor
              monacoLanguage={monacoLang}
              value={code}
              onChange={handleCodeChange}
              onCursorMove={emitCursorMove}
              readOnly={false}
            />
          </div>
        </div>

        <div className="w-95 flex flex-col">
          <div className="h-[45%]">
            <VideoPanel
              localStream={localStream}
              remoteStream={remoteStream}
              isConnected={isConnected}
              isMuted={isMuted}
              isCameraOff={isCameraOff}
              isScreenSharing={isScreenSharing}
              onToggleMute={toggleMute}
              onToggleCamera={toggleCamera}
              onToggleScreenShare={toggleScreenShare}
              role={role || "student"}
              permissionError={permissionError}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatPanel sessionId={session.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
