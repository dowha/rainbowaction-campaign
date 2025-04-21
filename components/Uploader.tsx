'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

type Props = {
  onSelect: (file: File) => void
}

export default function Uploader({ onSelect }: Props) {
  const [mode, setMode] = useState<'upload' | 'camera'>('upload')
  const [captured, setCaptured] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 720, height: 720 },
        audio: false,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setStreaming(true)
      }
    } catch {
      alert('카메라를 사용할 수 없습니다')
    }
  }

  const stopCamera = () => {
    const video = videoRef.current
    const stream = video?.srcObject as MediaStream
    stream?.getTracks().forEach((track) => track.stop())
    setStreaming(false)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onSelect(file)
      setCaptured(false)
      setPhotoDataUrl(null)
    }
  }

  const takePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 좌우 반전 (mirror effect)
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg')
    setPhotoDataUrl(dataUrl)

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'captured.jpg', { type: 'image/jpeg' })
        onSelect(file)
        setCaptured(true)
        stopCamera()
      }
    }, 'image/jpeg')
  }

  return (
    <div className="mb-6">
      <div className="flex justify-center gap-2 mb-3 text-sm font-medium">
        <button
          onClick={() => {
            setMode('upload')
            stopCamera()
          }}
          className={`px-3 py-1 rounded-full ${
            mode === 'upload'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          사진 업로드
        </button>
        <button
          onClick={() => {
            setMode('camera')
            startCamera()
          }}
          className={`px-3 py-1 rounded-full ${
            mode === 'camera'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          카메라로 촬영
        </button>
      </div>

      {mode === 'upload' && (
        <div className="text-center text-sm">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="block mx-auto mb-2 text-sm"
          />
        </div>
      )}

      {mode === 'camera' && (
        <div className="flex flex-col items-center">
          {streaming && (
            <div className="mb-2 flex items-center text-sm text-gray-600">
              <p>🔴 카메라 작동 중</p>
            </div>
          )}

          <div className="relative w-full max-w-xs mx-auto aspect-square bg-black rounded overflow-hidden">
            {!captured ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              photoDataUrl && (
                <Image
                  src={photoDataUrl}
                  alt="캡처된 이미지"
                  fill
                  className="object-cover"
                  unoptimized
                />
              )
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {!captured ? (
            <button
              onClick={takePhoto}
              className="mt-3 px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-500"
            >
              📸 사진 촬영하기
            </button>
          ) : (
            <button
              onClick={() => {
                setCaptured(false)
                setPhotoDataUrl(null)
                startCamera()
              }}
              className="mt-3 px-4 py-2 rounded bg-gray-600 text-white text-sm hover:bg-gray-500"
            >
              🔁 다시 찍기
            </button>
          )}
        </div>
      )}
    </div>
  )
}
