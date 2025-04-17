import { useEffect, useRef, useState } from 'react'

type Props = {
  image: File
  overlay: string
  position: 'top-left' | 'top-right' | 'bottom-right'
}

export default function CanvasPreview({
  image,
  overlay,
  position,
  setPosition,
}: Props & { setPosition?: (pos: Props['position']) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const displaySize = 240 // 화면에 표시될 크기(px)
    const exportSize = 720 // 다운로드용 해상도(px)

    const baseImage = new Image()
    const overlayImg = new Image()

    baseImage.onload = () => {
      canvas.width = exportSize
      canvas.height = exportSize

      // 화면에선 작게 보이게
      canvas.style.width = `${displaySize}px`
      canvas.style.height = `${displaySize}px`

      // 원본 이미지 비율 유지하며 중앙 정렬
      const ratio = Math.min(
        exportSize / baseImage.width,
        exportSize / baseImage.height
      )
      const w = baseImage.width * ratio
      const h = baseImage.height * ratio
      const x = (exportSize - w) / 2
      const y = (exportSize - h) / 2
      ctx.drawImage(baseImage, x, y, w, h)

      overlayImg.onload = () => {
        const badgeSize = exportSize / 3
        let ox = 0
        let oy = 0

        if (position === 'top-left') {
          ox = 12
          oy = 12
        } else if (position === 'top-right') {
          ox = exportSize - badgeSize - 12
          oy = 12
        } else if (position === 'bottom-right') {
          ox = exportSize - badgeSize - 12
          oy = exportSize - badgeSize - 12
        }

        ctx.drawImage(overlayImg, ox, oy, badgeSize, badgeSize)
        setDownloadUrl(canvas.toDataURL('image/png'))
      }

      overlayImg.onerror = () => {
        console.error('❌ overlay image failed to load')
      }

      overlayImg.src = '/' + overlay
    }

    baseImage.src = URL.createObjectURL(image)
  }, [image, overlay, position])

  return (
    <div className="mt-1 text-center">
      <h2 className="text-base font-semibold mb-3">미리보기</h2>
      <canvas
        ref={canvasRef}
        className="mx-auto mb-4 border border-gray-300 rounded bg-white"
      />
      {setPosition && (
        <div className="flex justify-center gap-2 mb-4">
          {[
            { label: '왼쪽 위', value: 'top-left' },
            { label: '오른쪽 위', value: 'top-right' },
            { label: '오른쪽 아래', value: 'bottom-right' },
          ].map((opt) => (
            <span
              key={opt.value}
              onClick={() => setPosition?.(opt.value as Props['position'])}
              className={`text-sm px-4 py-1 w-28 text-center rounded-full cursor-pointer transition select-none ${
                position === opt.value
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </span>
          ))}
        </div>
      )}
      {downloadUrl && (
        <a
          href={downloadUrl}
          download="campaign-image.png"
          target="_blank"
          className="inline-block px-4 py-2 text-sm text-white bg-gray-800 rounded hover:bg-gray-700 transition"
        >
          이미지 다운로드
        </a>
      )}
    </div>
  )
}
