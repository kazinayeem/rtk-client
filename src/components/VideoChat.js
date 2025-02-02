"use client"; // Ensure it runs on the client side
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("https://rtc-server-bsgm.onrender.com"); // Connect to signaling server

export default function VideoChat() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [isCallActive, setIsCallActive] = useState(false);

  useEffect(() => {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream
          .getTracks()
          .forEach((track) => peerConnection.addTrack(track, stream));
      });

    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) socket.emit("candidate", event.candidate);
    };

    socket.on("offer", async (offer) => {
      if (!peerConnection.currentRemoteDescription) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("answer", answer);
      }
    });

    socket.on("answer", async (answer) => {
      if (!peerConnection.currentRemoteDescription) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket.on("candidate", async (candidate) => {
      if (candidate)
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      peerConnection.close();
      socket.off("offer");
      socket.off("answer");
      socket.off("candidate");
    };
  }, []);

  const startCall = async () => {
    setIsCallActive(true);
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socket.emit("offer", offer);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-2 gap-4">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          className="w-64 h-48 bg-black"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-64 h-48 bg-black"
        />
      </div>
      <button
        onClick={startCall}
        disabled={isCallActive}
        className="px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        Start Call
      </button>
    </div>
  );
}
