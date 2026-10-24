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

// Swapped to a slightly more reliable free TURN server
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export function useWebRTC({ sessionId, role, enabled }: UseWebRTCArgs): UseWebRTCResult {
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

  // 1. Get Local Media
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.warn("Camera failed, trying audio...", err);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
          localStreamRef.current = stream;
          setLocalStream(stream);
          setPermissionError("Camera failed, joined audio only.");
        } catch (audioErr) {
          setPermissionError(audioErr instanceof Error ? audioErr.message : "Could not access media.");
        }
      }
    };
    init();
    return () => { cancelled = true; };
  }, [enabled]);

  // 2. Setup Peer Connection & Signaling
  useEffect(() => {
    if (!enabled || !localStream || !sessionId) return;

    const socket = connectSocket();
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    incomingStreamRef.current = new MediaStream();

    // Add local tracks
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    // Handle incoming tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!incomingStreamRef.current.getTracks().some((t) => t.id === track.id)) {
            incomingStreamRef.current.addTrack(track);
          }
        });
        setRemoteStream(new MediaStream(incomingStreamRef.current.getTracks()));
      }
    };

    // Send ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc_ice", { sessionId, candidate: event.candidate.toJSON() });
      }
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      console.log("📡 Connection State:", pc.connectionState);
      setIsConnected(pc.connectionState === "connected");
    };

    // --- SIGNALING EVENTS ---

        // MENTOR: When student joins, send offer
    socket.on("user_joined", async () => {
      if (role === "mentor") {
        try {
          // 🔥 FIX: If state is not stable, wait a tiny bit for React to finish
          setTimeout(async () => {
            if (pc.signalingState === "stable") {
              console.log("📤 MENTOR: Student joined, creating offer...");
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit("webrtc_offer", { sessionId, sdp: offer });
            }
          }, 500); 
        } catch (err) {
          console.error("Offer error:", err);
        }
      }
    });

    // STUDENT: Receive offer, send answer
        // --- SIGNALING EVENTS ---

    // MENTOR: When student joins, send offer
    socket.on("user_joined", async () => {
      if (role === "mentor") {
        try {
          if (pc.signalingState === "stable") {
            console.log("📤 MENTOR: Student joined, creating offer...");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("webrtc_offer", { sessionId, sdp: offer });
            console.log("📤 MENTOR: Offer sent to server.");
          }
        } catch (err) {
          console.error("Offer error:", err);
        }
      }
    });

    // STUDENT: Receive offer, send answer
    socket.on("webrtc_offer", async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      console.log("📥 STUDENT: Received offer from mentor.");
      if (role === "student") {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          
          for (const c of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidatesRef.current = [];

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc_answer", { sessionId, sdp: answer });
          console.log("📤 STUDENT: Answer sent to server.");
        } catch (err) {
          console.error("Answer error:", err);
        }
      }
    });

    // MENTOR: Receive answer
    socket.on("webrtc_answer", async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      console.log("📥 MENTOR: Received answer from student.");
      if (role === "mentor") {
        try {
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            for (const c of pendingCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingCandidatesRef.current = [];
            console.log("✅ MENTOR: Remote description set successfully.");
          }
        } catch (err) {
          console.error("Answer handle error:", err);
        }
      }
    });

    // BOTH: Receive ICE
    socket.on("webrtc_ice", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      } catch (err) {
        console.error("ICE error:", err);
      }
    });

    // CLEANUP
    return () => {
      socket.off("user_joined");
      socket.off("webrtc_offer");
      socket.off("webrtc_answer");
      socket.off("webrtc_ice");
      try { pc.close(); } catch { /* ignore */ }
      if (pcRef.current === pc) pcRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, localStream, sessionId, role]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      try { pcRef.current?.close(); } catch { /* ignore */ }
    };
  }, []);

  // Controls
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
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
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
    } catch (err) { console.error("Screen share error:", err); }
  }, [isScreenSharing]);

  return { localStream, remoteStream, isConnected, isMuted, isCameraOff, isScreenSharing, toggleMute, toggleCamera, toggleScreenShare, permissionError };
}