import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore } from "@/store/roomStore";
import { sessionsApi, type SessionInfo } from "@/lib/api";
import { getLanguage } from "@/lib/languages";
import { getErrorMessage } from "@/lib/errors";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { toast } from "sonner";
import { Loader2, LogOut, Copy, Check, Code, Video, MessageSquare } from "lucide-react";
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
import PairPulseLogo from "@/components/PairPulseLogo";
import { useWakeLock } from '@/hooks/useWakeLock'

export default function Room() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { code, language, setCode, setLanguage } = useRoomStore();

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"mentor" | "student" | null>(null);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<"code" | "video" | "chat">("code");

  // Inside the component:
useWakeLock()

    // 🛡️ HARDENING: Tab close warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Chrome requires returnValue to be set
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Load session
  useEffect(() => {
    if (!sessionId || !user) return;

    const load = async () => {
      useRoomStore.getState().reset();
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
    toast.info("Session ended by mentor");
    navigate("/dashboard");
  }, [navigate]);

  // 🔌 Socket
  const { emitCodeChange, emitCursorMove, emitLanguageChange } = useRoomSocket({
    sessionId: sessionId || "",
    userId: user?.id || "",
    name: profile?.name || "User",
    role: role || "student",
    enabled: !!session && !!user && !!role,
    onSessionEnded: handleSessionEnded,
  });

  // 🎥 WebRTC
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

  // 🔴 Recording
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

  useEffect(() => {
    return () => useRoomStore.getState().clearAllRemoteCursors();
  }, []);

  // Auto-end when timer hits zero
  useEffect(() => {
    if (!session || role !== "mentor") return;
    const endAt = new Date(session.startedAt).getTime() + session.durationMinutes * 60 * 1000;
    const check = () => {
      if (Date.now() >= endAt) {
        toast.info("Session time is up");
        if (user) sessionsApi.end(session.id, user.id, language, code).catch(() => {});
        navigate("/dashboard");
      }
    };
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [session, role, user, language, code, navigate]);

  useEffect(() => {
    return () => {
      if (isRecording) stopRecording().catch(() => {});
    };
  }, [isRecording, stopRecording]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    emitCodeChange(newCode);
  }, [setCode, emitCodeChange]);

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
    if (role !== "mentor") return toast.error("Only the mentor can record");
    await startRecording();
    toast.success("Recording started");
  };

  const handleStopRecording = async () => {
    toast.info("Saving recording...");
    await stopRecording();
    if (!recordingError) toast.success("Recording saved!");
  };

  const handleEndSession = async () => {
    if (!session || !user) return;
    if (!confirm("End this session for everyone?")) return;

    try {
      await sessionsApi.end(session.id, user.id, language, code);
      connectSocket().emit("session_ended", { sessionId: session.id });
      toast.success("Session ended");
      navigate("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to end session"));
    }
  };

  if (loading || !session || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-4" />
          <p className="text-neutral-400 text-sm">Connecting to room...</p>
        </div>
      </div>
    );
  }

  const monacoLang = getLanguage(language).monacoId;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-neutral-200 overflow-hidden">
      
      {/* HEADER */}
      <header className="h-14 md:h-16 flex items-center justify-between px-3 md:px-6 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2">
            <PairPulseLogo className="w-6 h-6 md:w-7 md:h-7" />
            <span className="text-sm md:text-base font-bold text-white hidden sm:block">PairPulse</span>
          </div>

          <div className="h-6 w-px bg-neutral-800 hidden sm:block" />

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-md md:rounded-lg text-xs md:text-sm font-mono transition-colors text-white"
          >
            <span className="tracking-widest">{session.code}</span>
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-neutral-400" />}
          </button>

          <div className="hidden sm:block">
            <SessionTimer startedAt={session.startedAt} durationMinutes={session.durationMinutes} />
          </div>

          {role === "mentor" && (
            <div className="hidden md:block">
              <RecordingControls
                isRecording={isRecording}
                recordingDuration={recordingDuration}
                onStart={handleStartRecording}
                onStop={handleStopRecording}
                disabled={!localStream}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-[10px] md:text-xs px-2 py-1 rounded bg-brand-500/10 text-brand-400 uppercase font-bold tracking-wider hidden sm:block">
            {role}
          </span>

          {role === "mentor" && (
            <button
              onClick={handleEndSession}
              className="px-2 py-1.5 md:px-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 md:bg-red-600 md:text-white md:hover:bg-red-500 rounded-md md:rounded-lg text-xs md:text-sm font-medium transition-colors"
            >
              End
            </button>
          )}

          <button
            onClick={() => navigate("/dashboard")}
            className="p-1.5 md:p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* LEFT: CODE EDITOR */}
        <div className={`flex-1 flex-col border-r border-neutral-800 ${mobileTab === 'code' ? 'flex' : 'hidden md:flex'}`}>
          <div className="h-10 flex items-center justify-between px-3 border-b border-neutral-800 bg-[#0a0a0a] shrink-0">
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
              <div className="w-2 h-2 rounded-full bg-brand-500" />
              <span>index.{getLanguage(language).extension}</span>
            </div>
            <LanguagePicker
              value={language}
              onChange={handleLanguageChange}
              disabled={role !== "mentor"}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              monacoLanguage={monacoLang}
              value={code}
              onChange={handleCodeChange}
              onCursorMove={emitCursorMove}
              readOnly={false}
            />
          </div>
        </div>

        {/* RIGHT: VIDEO + CHAT */}
        <div className={`w-full md:w-[400px] flex-col shrink-0 ${mobileTab !== 'code' ? 'flex' : 'hidden md:flex'}`}>
          
          <div className={`${mobileTab === 'video' ? 'h-[60%] md:h-[45%]' : 'hidden md:block md:h-[45%]'}`}>
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
              onEndSession={role === 'mentor' ? handleEndSession : undefined}
              role={role || "student"}
              permissionError={permissionError}
            />
          </div>

          <div className={`flex-1 overflow-hidden ${mobileTab === 'chat' ? 'block' : 'hidden md:block'}`}>
            <ChatPanel sessionId={session.id} />
          </div>
        </div>

      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden flex items-center justify-around border-t border-neutral-800 bg-neutral-900 h-16 shrink-0 pb-safe">
        <button 
          onClick={() => setMobileTab('code')} 
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${mobileTab === 'code' ? 'text-brand-400' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          <Code size={20} />
          <span className="text-[10px] font-medium">Code</span>
        </button>
        <button 
          onClick={() => setMobileTab('video')} 
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${mobileTab === 'video' ? 'text-brand-400' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          <Video size={20} />
          <span className="text-[10px] font-medium">Video</span>
        </button>
        <button 
          onClick={() => setMobileTab('chat')} 
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${mobileTab === 'chat' ? 'text-brand-400' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          <MessageSquare size={20} />
          <span className="text-[10px] font-medium">Chat</span>
        </button>
      </div>

    </div>
  );
}