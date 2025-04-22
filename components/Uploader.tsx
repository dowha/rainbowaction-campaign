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

  const MAX_SIZE = 720 // 최대 해상도(px)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== 'string') return

      const img = document.createElement('img') // ✅ 타입 에러 없음
      img.onload = () => {
        const size = Math.min(img.width, img.height)
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2
        const outputSize = Math.min(size, MAX_SIZE)

        const canvas = document.createElement('canvas')
        canvas.width = outputSize
        canvas.height = outputSize
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, sx, sy, size, size, 0, 0, outputSize, outputSize)

        canvas.toBlob((blob) => {
          if (!blob) return

          const resizedFile = new File([blob], file.name, { type: file.type })
          onSelect(resizedFile)
          setUploadedFileName(file.name)
          setCaptured(false)
          setPhotoDataUrl(null)
          setCameraError(false)
          setUploadedPreview(canvas.toDataURL(file.type)) // 미리보기는 DataURL로
        }, file.type)
      }

      img.src = result
    }

    reader.readAsDataURL(file)
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
            className="mb-3 inline-flex items-center space-x-1.5 px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 rounded-full transition" // 스타일 변경
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
              />
            </svg>
            <span>지금 촬영해서 꾸미기</span>
          </button>
          <div className="mx-auto w-full text-center max-w-[360px] overflow-hidden bg-gray-50 border border-gray-200 rounded-2xl px-4 py-5">
            <label
              htmlFor="file-upload"
              className={`cursor-pointer px-4 py-2 rounded-md transition text-sm ${
                uploadedFileName
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              {uploadedFileName ? '📂 다른 사진 선택' : '📁 앨범에서 사진 선택'}
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            <p className="mt-3 text-gray-500 text-xs text-center">
              PNG, JPG 등 이미지 파일을 업로드하세요. <br />
              정사각형 비율로 촬영된 사진이 가장 잘 어울립니다.
            </p>
          </div>

          {uploadedFileName && (
            <div className="mt-3 text-xs text-gray-700 text-center">
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
              <p className="mt-1">
                선택된 파일:{' '}
                <span className="font-medium underline">
                  {uploadedFileName}
                </span>
              </p>
            </div>
          )}
        </>
      )}

      {mode === 'camera' && (
        <>
          <button
            onClick={() => toggleMode('upload')}
            className="mb-3 inline-flex items-center space-x-1.5 px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 rounded-full transition" // 동일한 스타일 적용
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
            <span>가지고 있는 사진으로 꾸미기</span>
          </button>
          <div className="mx-auto w-full max-w-[360px] overflow-hidden bg-gray-50 border border-gray-200 rounded-2xl px-4 py-5">
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
                {/* z-index 추가 */}
                {/* 🔴 카메라 작동 중 표시 */}
                {streaming && !captured && !cameraError && (
                  <div className="bg-white/80 text-xs text-red-600 px-2 py-1 rounded shadow-sm animate-pulse">
                    {/* 깜빡임 효과 추가 */}
                    🔴 카메라 작동 중
                  </div>
                )}
              </div>

              {/* 촬영/다시찍기 버튼 (하단 중앙) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
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
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
    </div>
  )
}
