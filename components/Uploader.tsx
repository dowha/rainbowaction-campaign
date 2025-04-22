'use client'

import { useRef, useState } from 'react' // useEffect 추가 (선택적)
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
  const [cameraError, setCameraError] = useState(false) // <-- 카메라 에러 상태 추가

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = async () => {
    setCameraError(false) // <-- 시도 전에 에러 상태 초기화
    setStreaming(false) // <-- 스트리밍 상태 초기화
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 720, height: 720 },
        audio: false,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // 'loadedmetadata' 이벤트를 기다려 비디오 크기를 정확히 알 수 있도록 함 (선택적 개선)
        videoRef.current.onloadedmetadata = () => {
          setStreaming(true)
          console.log('Camera started successfully')
        }
      }
    } catch (err) {
      console.error('카메라 접근 오류:', err) // 콘솔에 에러 로깅
      setCameraError(true) // <-- 에러 발생 시 상태 설정
      setStreaming(false) // 스트리밍 상태 확실히 false로
      // alert 제거: 사용자에게 시각적 피드백(버튼)을 제공하므로 alert는 필요 없을 수 있음
      // alert('카메라를 사용할 수 없습니다. 브라우저 설정을 확인해주세요.');
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((track) => track.stop())
    setStreaming(false)
    // 필요하다면 여기서도 에러 상태 초기화: setCameraError(false);
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (기존 코드 동일)
    const file = e.target.files?.[0]
    if (file) {
      onSelect(file)
      setUploadedFileName(file.name)
      setCaptured(false) // 카메라 관련 상태 초기화
      setPhotoDataUrl(null)
      setCameraError(false) // 모드 변경 시 에러 상태 초기화

      const reader = new FileReader()
      reader.onloadend = () => setUploadedPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const takePhoto = () => {
    // ... (기존 코드 동일)
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !streaming) return // 스트리밍 중일 때만 촬영

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
        stopCamera() // 카메라 정지
      }
    }, 'image/jpeg')
  }

  const toggleMode = (target: 'upload' | 'camera') => {
    setMode(target)
    onClear()
    setCameraError(false) // <-- 모드 변경 시 에러 상태 초기화
    if (target === 'camera') {
      startCamera() // 비동기 함수 호출
    } else {
      stopCamera()
    }

    // 내부 상태도 초기화
    setCaptured(false)
    setPhotoDataUrl(null)
    setUploadedFileName(null)
    setUploadedPreview(null)
  }

  // "다시 찍기" 핸들러
  const handleRetake = () => {
    setCaptured(false)
    setPhotoDataUrl(null)
    onClear() // 선택된 파일 정보도 지움 (onSelect는 다시 호출될 것이므로)
    setCameraError(false) // <-- 다시 찍기 시 에러 상태 초기화
    startCamera() // 다시 카메라 시작
  }

  return (
    <div className="flex flex-col items-center justify-center text-sm">
      {mode === 'upload' && (
        <>
          {/* ... (업로드 모드 기존 코드) ... */}
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
            {/* 비디오 or 캡처된 이미지 or 에러 메시지 */}
            {!captured &&
              !cameraError && ( // 정상 스트리밍 또는 로딩 중
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] ${
                    streaming ? 'opacity-100' : 'opacity-0'
                  } transition-opacity duration-300`} // 로딩 중 투명하게
                />
              )}
            {captured &&
              photoDataUrl && ( // 캡처된 이미지 표시
                <Image
                  src={photoDataUrl}
                  alt="캡처된 이미지"
                  fill
                  unoptimized
                  className="object-cover"
                />
              )}
            {cameraError &&
              !captured && ( // 카메라 에러 시 안내 텍스트
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
                  <p className="text-lg mb-2">⚠️</p>
                  <p className="text-sm">
                    <strong>카메라를 사용할 수 없습니다.</strong>
                  </p>
                  <p className="text-xs mt-1">
                    카메라 접근 권한이 거부되었거나 오류가 발생했습니다.
                    <br />
                    현재 페이지를 <strong>새로고침</strong>하거나
                    <br />
                    브라우저 설정에서 <strong>권한</strong>을 확인해주세요.
                  </p>
                </div>
              )}

            {/* 상태 표시 (카메라 작동 중 / 권한 요청 버튼) */}
            <div className="absolute top-2 left-2 z-10">
              {' '}
              {/* z-index 추가 */}
              {/* 🔴 카메라 작동 중 표시 */}
              {streaming && !captured && !cameraError && (
                <div className="bg-white/80 text-xs text-red-600 px-2 py-1 rounded shadow-sm animate-pulse">
                  {' '}
                  {/* 깜빡임 효과 추가 */}
                  🔴 카메라 작동 중
                </div>
              )}
            </div>

            {/* 촬영/다시찍기 버튼 (하단 중앙) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              {' '}
              {/* z-index 추가 */}
              {!captured &&
                streaming &&
                !cameraError && ( // 스트리밍 중이고 에러 없을 때만 촬영 버튼 활성화
                  <button
                    onClick={takePhoto}
                    className="px-5 py-3 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
                    aria-label="사진 촬영"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                )}
              {captured && ( // 캡처 완료 시 다시 찍기 버튼
                <button
                  onClick={handleRetake} // 다시 찍기 함수 연결
                  className="p-3 rounded-full bg-gray-600 text-white hover:bg-gray-500 shadow focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75" // 패딩 조정 및 원형으로 변경
                  aria-label="다시 찍기" // 접근성을 위한 레이블
                >
                  {/* Heroicon: ArrowPath (Outline) */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* 서버 저장 안 됨 안내 (캡처 전이고 에러 없을 때) */}
          {!captured && !cameraError && (
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
