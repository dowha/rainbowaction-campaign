import { useRef, useState } from 'react'

export default function Uploader({
  onSelect,
}: {
  onSelect: (file: File) => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [mode, setMode] = useState<'upload' | 'camera'>('upload')
  const [streaming, setStreaming] = useState(false)
  const [captured, setCaptured] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onSelect(file)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setStreaming(true)
        setCaptured(false)
      }
    } catch (err) {
      alert('카메라 접근이 불가능합니다.')
      console.error(err)
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((track) => track.stop())
    setStreaming(false)
    setCaptured(false)
  }

  const takePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'captured.jpg', { type: 'image/jpeg' })
        onSelect(file)
        setCaptured(true)
      }
    }, 'image/jpeg')
  }

  return (
    <div className="w-full">
      <div className="flex justify-center gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded-full text-sm border ${
            mode === 'upload'
              ? 'bg-blue-100 border-blue-500 text-blue-700'
              : 'bg-white border-gray-300'
          }`}
          onClick={() => {
            setMode('upload')
            stopCamera()
          }}
        >
          사진 업로드
        </button>
        <button
          className={`px-3 py-1 rounded-full text-sm border ${
            mode === 'camera'
              ? 'bg-blue-100 border-blue-500 text-blue-700'
              : 'bg-white border-gray-300'
          }`}
          onClick={() => {
            setMode('camera')
            startCamera()
          }}
        >
          카메라 촬영
        </button>
      </div>

      {mode === 'upload' && (
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
          />
        </div>
      )}

      {mode === 'camera' && (
        <div className="flex flex-col items-center">
          {streaming && (
            <div className="mb-2 flex items-center text-sm text-gray-600">
              <p>카메라 작동 중</p>
            </div>
          )}
          <video
            ref={videoRef}
            className="w-full max-w-xs rounded border"
            playsInline
            muted
          />
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
              onClick={startCamera}
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
