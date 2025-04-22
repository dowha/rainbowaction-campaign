'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

type Props = {
  onSelect: (file: File) => void
  onClear: () => void
}

export default function Uploader({ onSelect, onClear }: Props) {
  const [mode, setMode] = useState<'upload' | 'camera'>('upload')
  const [captured, setCaptured] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null)

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
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((track) => track.stop())
    setStreaming(false)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onSelect(file)
      setUploadedFileName(file.name)
      setCaptured(false)
      setPhotoDataUrl(null)

      const reader = new FileReader()
      reader.onloadend = () => setUploadedPreview(reader.result as string)
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

  const toggleMode = (target: 'upload' | 'camera') => {
    setMode(target)
    onClear()
    if (target === 'camera') {
      startCamera()
    } else {
      stopCamera()
    }

    // 내부 상태도 초기화
    setCaptured(false)
    setPhotoDataUrl(null)
    setUploadedFileName(null)
    setUploadedPreview(null)
  }

  return (
    <div className="flex flex-col items-center justify-center text-sm">
      {mode === 'upload' && (
        <>
          <button
            onClick={() => toggleMode('camera')}
            className="mb-3 px-4 py-2 border rounded-md transition bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          >
            지금 촬영해서 꾸미기
          </button>

          <label
            htmlFor="file-upload"
            className={`cursor-pointer px-4 py-2 rounded-md transition text-sm ${
              uploadedFileName
                ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
          >
            {uploadedFileName ? '📁 다른 사진 선택' : '📁 앨범에서 사진 선택'}
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
          {!uploadedFileName && (
            <p className="text-xs text-green-800 mt-6 px-4 py-3 border border-green-300 bg-green-50 rounded-2xl text-center">
              🔒 이미지는 브라우저에서만 처리되며, 서버에 저장되지 않습니다.
            </p>
          )}

          {uploadedFileName && (
            <div className="mt-3 text-xs text-gray-700 text-center">
              <p className="mb-1">
                ✅ 선택된 파일:{' '}
                <span className="font-medium underline">
                  {uploadedFileName}
                </span>
              </p>
              {uploadedPreview && (
                <div className="relative w-full max-w-xs mx-auto aspect-square rounded border overflow-hidden">
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
        </>
      )}

      {mode === 'camera' && (
        <>
          <button
            onClick={() => toggleMode('upload')}
            className="mb-3 px-4 py-2 border rounded-md transition bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          >
            가지고 있는 사진으로 꾸미기
          </button>

          <div className="relative w-full max-w-xs mx-auto aspect-square bg-black rounded overflow-hidden">
            {/* 비디오 or 캡처된 이미지 */}
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
                  unoptimized
                  className="object-cover"
                />
              )
            )}

            {/* 🔴 카메라 작동 중 표시 */}
            {streaming && !captured && (
              <div className="absolute top-2 left-2 bg-white/80 text-xs text-red-600 px-2 py-1 rounded shadow-sm">
                🔴 카메라 작동 중
              </div>
            )}

            {/* 촬영/다시찍기 버튼 (하단 중앙) */}
            {!captured ? (
              <button
                onClick={takePhoto}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-500 shadow"
              >
                📸 촬영하기
              </button>
            ) : (
              <button
                onClick={() => {
                  setCaptured(false)
                  setPhotoDataUrl(null)
                  startCamera()
                }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded bg-gray-600 text-white text-sm hover:bg-gray-500 shadow"
              >
                🔁 다시 찍기
              </button>
            )}
          </div>
          {!captured && (
            <p className="text-xs text-green-800 mt-6 px-4 py-3 border border-green-300 bg-green-50 rounded-2xl text-center">
              🔒 이미지는 브라우저에서만 처리되며, 서버에 저장되지 않습니다.
            </p>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
    </div>
  )
}
