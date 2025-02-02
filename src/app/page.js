import VideoChat from "@/components/VideoChat";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">WebRTC Video Chat</h1>
      <VideoChat />
    </main>
  );
}
