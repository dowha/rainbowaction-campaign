import { useEffect, useRef, useState } from 'react'

interface Props {
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
  // const [touchReady, setTouchReady] = useState(false)
  const [showMobileHint, setShowMobileHint] = useState(false)
  const [allowDrag, setAllowDrag] = useState(false)

  const dragStart = useRef({ x: 0, y: 0 })
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const isFullAsset = ['asset08.png', 'asset09.png', 'asset10.png'].includes(
    overlay
  )
  const isMobile =
    typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)

  useEffect(() => {
    if (
      overlay === 'asset01.png' &&
      overlayPos.x === 240 &&
      overlayPos.y === 240
    ) {
      setOverlayPos({ x: 240, y: 30 })
    }
  }, [overlay, overlayPos])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const exportSize = 720

    const baseImage = new Image()
    const overlayImg = new Image()

    baseImage.onload = () => {
      overlayImg.onload = () => {
        canvas.width = exportSize
        canvas.height = exportSize
        canvas.style.width = '100%'
        canvas.style.height = 'auto'

        ctx.clearRect(0, 0, canvas.width, canvas.height)

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

  const getCoords = (e: MouseEvent | TouchEvent) => {
    const clientX =
      'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
    const clientY =
      'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
    return { x: clientX, y: clientY }
  }

  const isWithinOverlay = (x: number, y: number) => {
    const s = scale * 720 * 0.3
    return (
      x >= overlayPos.x &&
      x <= overlayPos.x + s &&
      y >= overlayPos.y &&
      y <= overlayPos.y + s
    )
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isFullAsset) return

    const coords = getCoords(e.nativeEvent)
    const within = isWithinOverlay(coords.x, coords.y)
    setAllowDrag(within)
    if (!within) return

    if ('touches' in e.nativeEvent) {
      longPressTimer.current = setTimeout(() => {
        setIsDragging(true)
      }, 500)
    } else {
      setIsDragging(true)
    }

    dragStart.current = {
      x: coords.x - overlayPos.x,
      y: coords.y - overlayPos.y,
    }
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!allowDrag || !isDragging || isFullAsset) return
    const coords = getCoords(e.nativeEvent)
    setOverlayPos({
      x: coords.x - dragStart.current.x,
      y: coords.y - dragStart.current.y,
    })
  }

  const handleEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setIsDragging(false)
    setAllowDrag(false)
  }

  useEffect(() => {
    if (isMobile) {
      setShowMobileHint(true)
      const t = setTimeout(() => setShowMobileHint(false), 2500)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mt-1 text-center select-none">
      <h2 className="text-base font-semibold mb-3">미리보기</h2>

      <div className="mx-auto w-full max-w-[360px] overflow-hidden bg-gray-50 border border-gray-200 rounded-2xl shadow-sm px-4 py-5">
        {showMobileHint && (
          <p className="mb-2 text-xs text-gray-500 animate-pulse">
            📍 길게 누르면 에셋을 이동할 수 있어요
          </p>
        )}

        <div
          className="relative w-full max-w-[320px] mx-auto"
          style={{ touchAction: isDragging ? 'none' : 'pan-y' }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          onTouchCancel={handleEnd}
        >
          <canvas
            ref={canvasRef}
            className={`w-full max-w-full border border-gray-300 rounded bg-white ${
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
              onClick={() => window.location.reload()}
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
