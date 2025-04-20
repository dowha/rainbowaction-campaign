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

  // asset01이면 처음 선택 시 상단 중앙 배치 (크기는 useState 초기값으로 처리됨)
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

        const ratio = Math.min(
          exportSize / baseImage.width,
          exportSize / baseImage.height
        )
        const w = baseImage.width * ratio
        const h = baseImage.height * ratio
        const x = (exportSize - w) / 2
        const y = (exportSize - h) / 2
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(baseImage, x, y, w, h)

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isFullAsset) return
    setIsDragging(true)
    dragStart.current = {
      x: e.clientX - overlayPos.x,
      y: e.clientY - overlayPos.y,
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isFullAsset) return
    setOverlayPos({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  return (
    <div className="mt-1 text-center select-none">
      <h2 className="text-base font-semibold mb-3">미리보기</h2>

      <div className="mx-auto max-w-sm w-full bg-gray-50 border border-gray-200 rounded-2xl shadow-sm px-4 py-5">
        <div
          className="relative"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            className={`mx-auto border border-gray-300 rounded bg-white ${
              isFullAsset ? 'cursor-default' : 'cursor-move'
            }`}
          />
        </div>

        {!isFullAsset && (
          <div className="flex flex-col items-center gap-1 mt-4">
            <label className="text-sm text-gray-600">크기 조절</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        {downloadUrl && (
          <div className="mt-5">
            <a
              href={downloadUrl}
              download="campaign-image.png"
              target="_blank"
              className="inline-block w-full text-center px-4 py-2 text-sm text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              이미지 다운로드
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
