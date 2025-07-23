"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Hls from "hls.js"
import { Play, Pause, Volume2, VolumeX, Maximize, ChevronRight, MonitorSmartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Avatar } from "@/components/ui/avatar"

declare global {
  interface Window {
    chrome: any
    __onGCastApiAvailable: (isAvailable: boolean) => void
  }
}

interface HLSPlayerProps {
  src: string
  title?: string
  author?: string
  date?: string
  avatarUrl?: string
}

export default function HLSPlayer({
  src,
  title = "Canlı Yayın",
  author = "Yuda Player",
  date = "2025",
  avatarUrl,
}: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [videoWidth, setVideoWidth] = useState(0)
  const [videoHeight, setVideoHeight] = useState(0)
  const [isPiP, setIsPiP] = useState(false)

  const [isCastAvailable, setIsCastAvailable] = useState(false)
  const [isCasting, setIsCasting] = useState(false)
  const [castSession, setCastSession] = useState<any>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(src)
      hls.attachMedia(video)
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src
    }

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDimensions = () => {
      setVideoWidth(video.videoWidth)
      setVideoHeight(video.videoHeight)
    }

    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("loadedmetadata", () => {
      setDuration(video.duration)
      updateDimensions()
    })

    return () => {
      video.removeEventListener("timeupdate", updateTime)
    }
  }, [src])

  useEffect(() => {
    // Load Google Cast SDK
    const script = document.createElement("script")
    script.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
    script.async = true
    document.head.appendChild(script)

    window.__onGCastApiAvailable = (isAvailable: boolean) => {
      if (isAvailable) {
        const cast = window.chrome.cast
        const sessionRequest = new cast.SessionRequest(cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID)
        const apiConfig = new cast.ApiConfig(
          sessionRequest,
          (session: any) => {
            setCastSession(session)
            setIsCasting(true)
          },
          (availability: string) => {
            setIsCastAvailable(availability === "available")
          },
        )
        cast.initialize(apiConfig)
      }
    }

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0]
    setVolume(volumeValue)
    if (videoRef.current) {
      videoRef.current.volume = volumeValue
    }
  }

  const handleSeek = (newTime: number[]) => {
    const seekTime = newTime[0]
    setCurrentTime(seekTime)
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime
    }
  }

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        containerRef.current.requestFullscreen()
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const togglePiP = async () => {
    if (!videoRef.current) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPiP(false)
      } else {
        await videoRef.current.requestPictureInPicture()
        setIsPiP(true)
      }
    } catch (error) {
      console.error("PiP failed:", error)
    }
  }

  const startCasting = () => {
    if (window.chrome && window.chrome.cast) {
      window.chrome.cast.requestSession(
        (session: any) => {
          setCastSession(session)
          setIsCasting(true)

          // Create media info
          const mediaInfo = new window.chrome.cast.media.MediaInfo(src, "application/x-mpegURL")
          mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata()
          mediaInfo.metadata.title = title
          mediaInfo.metadata.subtitle = `${author} • ${date}`

          const request = new window.chrome.cast.media.LoadRequest(mediaInfo)
          session.loadMedia(request)
        },
        (error: any) => {
          console.error("Cast session error:", error)
        },
      )
    }
  }

  const stopCasting = () => {
    if (castSession) {
      castSession.stop()
      setCastSession(null)
      setIsCasting(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-black overflow-hidden group w-screen h-screen"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Header */}
      <div
        className={`absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-3">
          <Avatar
            className={`h-8 w-8 rounded-full ${!avatarUrl ? "bg-gradient-to-br from-[#4162FF] via-[#2D44B1] to-[#1A237E]" : ""}`}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl || "/placeholder.svg"}
                alt={author}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <span className="text-white text-sm font-medium flex items-center justify-center w-full h-full">
                {author.charAt(0)}
              </span>
            )}
          </Avatar>
          <div className="flex-1">
            <h3 className="text-white font-semibold flex items-center gap-2">
              {title}
              <ChevronRight className="w-4 h-4" />
            </h3>
            <p className="text-white/80 text-sm">
              {author} • {date}
            </p>
          </div>
        </div>
      </div>

      {/* Video */}
      <video ref={videoRef} className="w-full h-full" playsInline onClick={togglePlay} />

      {/* Center Play/Pause Button */}
      <div
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={togglePlay}
          className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-black/30 hover:bg-black/50 transition-colors duration-300"
        >
          <div className="absolute inset-0 bg-white/10 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
          {isPlaying ? (
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress Bar */}
        <div className="px-4 pt-16 pb-2 relative">
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleSeek}
            className="w-full [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:rounded-full [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#4162FF] [&_[role=slider]]:bg-[#4162FF] [&_[role=range]]:h-1 [&_[role=range]]:bg-[#4162FF]"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-3 p-4 pt-0">
          <Button variant="ghost" size="icon" onClick={togglePlay} className="h-8 w-8 rounded-full hover:bg-white/10">
            {isPlaying ? (
              <Pause className="h-5 w-5 text-white fill-current" />
            ) : (
              <Play className="h-5 w-5 text-white fill-current" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleVolumeChange([volume === 0 ? 1 : 0])}
              className="h-8 w-8 rounded-full hover:bg-white/10"
            >
              {volume === 0 ? (
                <VolumeX className="h-5 w-5 text-white fill-current" />
              ) : (
                <Volume2 className="h-5 w-5 text-white fill-current" />
              )}
            </Button>
          </div>

          <span className="text-white text-sm font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {/* Google Cast Button - TV'ye yansıtmak için */}
            <Button
              variant="ghost"
              size="icon"
              onClick={isCasting ? stopCasting : startCasting}
              className={`h-8 w-8 rounded-lg hover:bg-white/10 ${isCasting ? "bg-[#4162FF]/20" : ""}`}
              title={isCasting ? "TV'den çık" : "TV'ye yansıt"}
            >
              <svg
                className={`h-6 w-6 ${isCasting ? "text-[#4162FF]" : "text-white"} fill-current`}
                viewBox="0 0 24 24"
              >
                <path d="M1,18 L1,21 L4,21 C4,19.34 2.66,18 1,18 L1,18 Z M1,14 L1,16 C3.76,16 6,18.24 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z M1,10 L1,12 C5.97,12 10,16.03 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z" />
              </svg>
            </Button>

            <Button variant="ghost" size="icon" onClick={togglePiP} className="h-8 w-8 rounded-lg hover:bg-white/10">
              <MonitorSmartphone className="h-5 w-5 text-white fill-current" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8 rounded-lg hover:bg-white/10"
            >
              <Maximize className="h-5 w-5 text-white fill-current" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
