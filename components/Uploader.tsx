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
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null)

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

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onSelect(file)
      setUploadedFileName(file.name)
      setCaptured(false)
      setPhotoDataUrl(null)

      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
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
      <div className="flex justify-center gap-2 mb-4 text-sm font-medium">
        <button
          onClick={() => {
            setMode('upload')
            stopCamera()
          }}
          className={`px-4 py-2 border rounded-md transition ${
            mode === 'upload'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          사진 업로드
        </button>
        <button
          onClick={() => {
            setMode('camera')
            startCamera()
          }}
          className={`px-4 py-2 border rounded-md transition ${
            mode === 'camera'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          카메라로 촬영
        </button>
      </div>

      {mode === 'upload' && (
        <div className="flex flex-col items-center justify-center text-sm">
          <label
            htmlFor="file-upload"
            className={`cursor-pointer px-4 py-2 rounded-md transition text-sm ${
              uploadedFileName
                ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
          >
            {uploadedFileName ? '📁 다른 사진 선택하기' : '📁 사진 선택하기'}
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <p className="mt-2 text-gray-500 text-xs text-center">
            PNG, JPG 등 이미지 파일을 업로드하세요. <br />
            정사각형 비율로 촬영된 사진이 가장 잘 어울립니다.
          </p>
          {uploadedFileName && (
            <div className="mt-3 text-xs text-gray-700 text-center">
              <p className="mb-1">
                ✅ 선택된 파일:{' '}
                <span className="font-medium">{uploadedFileName}</span>
              </p>
              {uploadedPreview && (
                <div className="mx-auto w-16 h-16 relative rounded border overflow-hidden">
                  <Image
                    src={uploadedPreview}
                    alt="업로드 미리보기"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          )}
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
