import { useEffect, useRef, useState } from 'react'

type Props = {
  image: File
  overlay: string
}

export default function CanvasPreview({ image, overlay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [overlayPos, setOverlayPos] = useState({ x: 240, y: 240 })
  const [scale, setScale] = useState(() =>
    overlay === 'asset01.png' ? 1.8 : 1
  )
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const isFullAsset = ['asset08.png', 'asset09.png', 'asset10.png'].includes(
    overlay
  )

  useEffect(() => {
    if (overlayPos.x === 240 && overlayPos.y === 240) {
      if (
        overlay === 'asset01.png' ||
        overlay === 'asset02.png' ||
        overlay === 'asset03.png' ||
        overlay === 'asset04.png'
      ) {
        setOverlayPos({ x: 240, y: 30 })
      } else if (overlay === 'asset05.png' || overlay === 'asset06.png') {
        setOverlayPos({ x: 400, y: 240 })
      } else if (overlay === 'asset07.png') {
        setOverlayPos({ x: 240, y: 240 })
      }
    }
  }, [overlay, overlayPos])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const displaySize = 360
    const exportSize = 720

    const baseImage = new Image()
    const overlayImg = new Image()

    baseImage.onload = () => {
      overlayImg.onload = () => {
        canvas.width = exportSize
        canvas.height = exportSize
        canvas.style.width = `${displaySize}px`
        canvas.style.height = `${displaySize}px`

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // ✅ 정사각형 중앙 크롭 로직
        const short = Math.min(baseImage.width, baseImage.height)
        const sx = (baseImage.width - short) / 2
        const sy = (baseImage.height - short) / 2

        ctx.drawImage(
          baseImage,
          sx,
          sy,
          short,
          short,
          0,
          0,
          exportSize,
          exportSize
        )

        if (isFullAsset) {
          ctx.drawImage(overlayImg, 0, 0, exportSize, exportSize)
        } else {
          const s = scale * exportSize * 0.3
          ctx.drawImage(overlayImg, overlayPos.x, overlayPos.y, s, s)
        }

        setDownloadUrl(canvas.toDataURL('image/png'))
      }

      overlayImg.src = '/' + overlay
    }

    baseImage.src = image instanceof File ? URL.createObjectURL(image) : ''
  }, [image, overlay, overlayPos, scale, isFullAsset])

  // ✅ 공통 좌표 계산
  const getCoords = (e: MouseEvent | TouchEvent) => {
    const clientX =
      'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
    const clientY =
      'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
    return { x: clientX, y: clientY }
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isFullAsset) return
    setIsDragging(true)
    const coords = getCoords(e.nativeEvent)
    dragStart.current = {
      x: coords.x - overlayPos.x,
      y: coords.y - overlayPos.y,
    }
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || isFullAsset) return
    const coords = getCoords(e.nativeEvent)
    setOverlayPos({
      x: coords.x - dragStart.current.x,
      y: coords.y - dragStart.current.y,
    })
  }

  const handleEnd = () => setIsDragging(false)

  return (
    <div className="mt-1 text-center select-none">
      <h2 className="text-base font-semibold mb-3">미리보기</h2>

      <div className="mx-auto max-w-sm w-full bg-gray-50 border border-gray-200 rounded-2xl shadow-sm px-4 py-5">
        <div
          className="relative touch-none"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        >
          <canvas
            ref={canvasRef}
            className={`mx-auto border border-gray-300 rounded bg-white ${
              isFullAsset ? 'cursor-default' : 'cursor-move'
            } transition-all duration-200 ease-out`}
          />
        </div>

        {!isFullAsset && (
          <div className="flex flex-col items-center gap-1 mt-4">
            <label className="text-sm text-gray-600">크기 조절</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-6 accent-blue-600 touch-none cursor-pointer"
            />
          </div>
        )}

        {downloadUrl && (
          <div className="mt-5 space-y-3">
            <a
              onClick={() => {
                window.location.reload() // 상태 초기화하고 Step1로 이동
              }}
              className="block no-underline hover:no-underline w-full text-center px-4 py-2 text-sm text-gray-800 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition cursor-pointer"
            >
              사진 다시 올리기
            </a>

            <a
              href={downloadUrl}
              download="campaign-image.png"
              target="_blank"
              className="block no-underline hover:no-underline w-full text-center px-4 py-2 text-sm text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              이미지 다운로드
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
