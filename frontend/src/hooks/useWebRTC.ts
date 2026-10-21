import { useCallback, useEffect, useRef, useState } from "react";
import { connectSocket } from "@/lib/socket";

type Role = "mentor" | "student";

interface UseWebRTCArgs {
  sessionId: string;
  role: Role;
  enabled: boolean;
}

interface UseWebRTCResult {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  permissionError: string | null;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useWebRTC({
  sessionId,
  role,
  enabled,
}: UseWebRTCArgs): UseWebRTCResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const incomingStreamRef = useRef<MediaStream>(new MediaStream());

  // ------------------------------------------------
  // Get local media
  // ------------------------------------------------
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 24 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setPermissionError(null);
      } catch (err) {
        console.error("media access error:", err);
        setPermissionError(
          err instanceof Error
            ? err.message
            : "Could not access camera/microphone",
        );
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // ------------------------------------------------
  // Set up peer connection
  // ------------------------------------------------
  useEffect(() => {
    if (!enabled || !localStream || !sessionId) return;

    const socket = connectSocket();
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Reset incoming stream on new PC
    incomingStreamRef.current = new MediaStream();

    // Add local tracks
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // ✅ FIX: safe ontrack handler
    pc.ontrack = (event) => {
      try {
        // Safely handle missing streams array
        const remoteStreamFromEvent =
          event.streams && event.streams[0] ? event.streams[0] : null;

        if (remoteStreamFromEvent) {
          remoteStreamFromEvent.getTracks().forEach((track) => {
            const already = incomingStreamRef.current
              .getTracks()
              .some((t) => t.id === track.id);
            if (!already) {
              incomingStreamRef.current.addTrack(track);
            }
          });
        } else if (event.track) {
          // Fallback: use track directly
          const already = incomingStreamRef.current
            .getTracks()
            .some((t) => t.id === event.track.id);
          if (!already) {
            incomingStreamRef.current.addTrack(event.track);
          }
        }

        // Create a new MediaStream instance to trigger re-render
        setRemoteStream(
          new MediaStream(incomingStreamRef.current.getTracks()),
        );
      } catch (err) {
        console.error("ontrack error:", err);
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket.connected) {
        socket.emit("webrtc_ice", {
          sessionId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("📡 connection state:", pc.connectionState);
      setIsConnected(pc.connectionState === "connected");
    };

    // ------------------------------------------------
    // SIGNALING HANDLERS
    // ------------------------------------------------
    const handleOffer = async ({
      sdp,
    }: {
      sdp: RTCSessionDescriptionInit;
    }) => {
      try {
        if (pc.signalingState === "closed") return;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        for (const c of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch (e) {
            console.warn("failed to add pending candidate:", e);
          }
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc_answer", { sessionId, sdp: answer });
      } catch (err) {
        console.error("offer handling error:", err);
      }
    };

    const handleAnswer = async ({
      sdp,
    }: {
      sdp: RTCSessionDescriptionInit;
    }) => {
      try {
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          for (const c of pendingCandidatesRef.current) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            } catch (e) {
              console.warn("failed to add pending candidate:", e);
            }
          }
          pendingCandidatesRef.current = [];
        }
      } catch (err) {
        console.error("answer handling error:", err);
      }
    };

    const handleIce = async ({
      candidate,
    }: {
      candidate: RTCIceCandidateInit;
    }) => {
      try {
        if (pc.signalingState === "closed") return;
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      } catch (err) {
        console.error("ice candidate error:", err);
      }
    };

    socket.on("webrtc_offer", handleOffer);
    socket.on("webrtc_answer", handleAnswer);
    socket.on("webrtc_ice", handleIce);

    // ------------------------------------------------
    // INITIATOR LOGIC
    // ------------------------------------------------
    let offerTimeout: ReturnType<typeof setTimeout> | null = null;

    if (role === "mentor") {
      offerTimeout = setTimeout(async () => {
        try {
          if (pc.signalingState === "closed") return;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (socket.connected) {
            socket.emit("webrtc_offer", { sessionId, sdp: offer });
          }
          console.log("📤 sent offer");
        } catch (err) {
          console.error("offer creation error:", err);
        }
      }, 1500);
    }

    // ------------------------------------------------
    // CLEANUP
    // ------------------------------------------------
    return () => {
      if (offerTimeout) clearTimeout(offerTimeout);
      socket.off("webrtc_offer", handleOffer);
      socket.off("webrtc_answer", handleAnswer);
      socket.off("webrtc_ice", handleIce);
      try {
        pc.close();
      } catch (err) {
        console.warn("pc.close error:", err);
      }
      if (pcRef.current === pc) {
        pcRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, localStream, sessionId, role]);

  // ------------------------------------------------
  // Cleanup on unmount
  // ------------------------------------------------
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        pcRef.current?.close();
      } catch {
        /* ignore */
      }
    };
  }, []);

  // ------------------------------------------------
  // CONTROLS
  // ------------------------------------------------
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOff(!videoTrack.enabled);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    const currentStream = localStreamRef.current;
    if (!pc || !currentStream) return;

    try {
      if (isScreenSharing) {
        screenStreamRef.current?.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;

        const camTrack = currentStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && camTrack) await sender.replaceTrack(camTrack);

        setIsScreenSharing(false);
      } else {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = displayStream;

        const screenTrack = displayStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(screenTrack);

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
          const camTrack = currentStream.getVideoTracks()[0];
          const s = pc.getSenders().find((x) => x.track?.kind === "video");
          if (s && camTrack) s.replaceTrack(camTrack);
        };

        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error("screen share error:", err);
    }
  }, [isScreenSharing]);

  return {
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
  };
}