"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import HLSPlayer from "@/components/HLSPlayer"

function VideoPlayer() {
  const searchParams = useSearchParams()
  const videoUrl = searchParams.get("url") || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"

  return (
    <main className="min-h-screen bg-black">
      <HLSPlayer src={videoUrl} />
    </main>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </main>
      }
    >
      <VideoPlayer />
    </Suspense>
  )
}
