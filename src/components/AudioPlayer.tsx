/**
 * Player de Áudio para Narração de Histórias
 * Com controles child-friendly
 */

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  audioUrl: string
  audioDurationSeconds?: number
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  className?: string
}

export const AudioPlayer = ({
  audioUrl,
  audioDurationSeconds,
  onPlay,
  onPause,
  onEnded,
  className,
}: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(audioDurationSeconds || 0)
  const [volume, setVolume] = useState(80)
  const [playbackRate, setPlaybackRate] = useState(1.0)

  // Atualizar tempo atual
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [onEnded])

  // Play/Pause
  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      onPause?.()
    } else {
      audio.play()
      setIsPlaying(true)
      onPlay?.()
    }
  }

  // Reiniciar
  const restart = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = 0
    audio.play()
    setIsPlaying(true)
    onPlay?.()
  }

  // Seek
  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

  // Volume
  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0]
    audio.volume = newVolume / 100
    setVolume(newVolume)
  }

  // Velocidade
  const toggleSpeed = () => {
    const audio = audioRef.current
    if (!audio) return

    const speeds = [0.75, 1.0, 1.25, 1.5]
    const currentIndex = speeds.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % speeds.length
    const newSpeed = speeds[nextIndex]

    audio.playbackRate = newSpeed
    setPlaybackRate(newSpeed)
  }

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn('rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 p-6 border-2 border-purple-300', className)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Título */}
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-full bg-purple-500 p-2">
          <Volume2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-purple-800">
            Narração do Capítulo
          </h3>
          <p className="text-sm text-purple-600">
            Ouça a história com uma voz mágica!
          </p>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="mb-4">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
        <div className="mt-2 flex justify-between text-sm font-medium text-purple-700">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-4">
        {/* Reiniciar */}
        <Button
          size="lg"
          variant="outline"
          onClick={restart}
          className="rounded-full h-14 w-14 p-0 border-2 border-purple-400 hover:bg-purple-100"
        >
          <RotateCcw className="h-6 w-6 text-purple-600" />
        </Button>

        {/* Play/Pause */}
        <Button
          size="lg"
          onClick={togglePlay}
          className="rounded-full h-20 w-20 p-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          {isPlaying ? (
            <Pause className="h-10 w-10 text-white fill-white" />
          ) : (
            <Play className="h-10 w-10 text-white fill-white ml-1" />
          )}
        </Button>

        {/* Velocidade */}
        <Button
          size="lg"
          variant="outline"
          onClick={toggleSpeed}
          className="rounded-full h-14 px-4 border-2 border-purple-400 hover:bg-purple-100 font-bold text-purple-600"
        >
          {playbackRate}x
        </Button>
      </div>

      {/* Volume */}
      <div className="mt-6 flex items-center gap-3">
        <Volume2 className="h-5 w-5 text-purple-600" />
        <Slider
          value={[volume]}
          max={100}
          step={5}
          onValueChange={handleVolumeChange}
          className="flex-1"
        />
        <span className="text-sm font-medium text-purple-700 min-w-[40px]">
          {volume}%
        </span>
      </div>
    </div>
  )
}

export default AudioPlayer
