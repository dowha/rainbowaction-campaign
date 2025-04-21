import React, { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  image: File
  overlay: string
}
// --- Helper functions (outside component) ---
const getInitialPos = (overlay: string): { x: number; y: number } => {
  if (overlay === 'asset01.png') return { x: 240, y: 30 }
  return { x: 240, y: 240 }
}

const getInitialScale = (overlay: string): number => {
  if (overlay === 'asset01.png') return 1.8
  return 1
}

const isFullAssetOverlay = (overlay: string): boolean => {
  return ['asset08.png', 'asset09.png', 'asset10.png'].includes(overlay)
}
// ---

export default function CanvasPreview({ image, overlay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [overlayPos, setOverlayPos] = useState(() => getInitialPos(overlay))
  const [scale, setScale] = useState(() => getInitialScale(overlay))
  const [isDragging, setIsDragging] = useState(false)

  const dragStartOffset = useRef({ x: 0, y: 0 })
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const originalBodyOverflowY = useRef<string>('')

  // 터치가 에셋 위에서 시작되었는지 추적하는 ref
  const touchStartedOnAsset = useRef(false)

  const isFullAsset = isFullAssetOverlay(overlay)
  const isMobile =
    typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)

  // --- Canvas Drawing Effect ---
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const exportSize = 720
    const baseImage = new Image()
    const overlayImg = new Image()
    let currentObjectUrl: string | null = null

    baseImage.onload = () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }

      overlayImg.onload = () => {
        canvas.width = exportSize
        canvas.height = exportSize
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const shortSide = Math.min(baseImage.width, baseImage.height)
        const sx = (baseImage.width - shortSide) / 2
        const sy = (baseImage.height - shortSide) / 2
        ctx.drawImage(
          baseImage,
          sx,
          sy,
          shortSide,
          shortSide,
          0,
          0,
          exportSize,
          exportSize
        )

        if (isFullAsset) {
          ctx.drawImage(overlayImg, 0, 0, exportSize, exportSize)
        } else {
          const overlayDrawSize = scale * exportSize * 0.3
          ctx.drawImage(
            overlayImg,
            overlayPos.x,
            overlayPos.y,
            overlayDrawSize,
            overlayDrawSize
          )
        }
        setDownloadUrl(canvas.toDataURL('image/png'))
      }
      overlayImg.onerror = () =>
        console.error(`Failed to load overlay: /${overlay}`)
      overlayImg.src = '/' + overlay
    }
    baseImage.onerror = () => {
      console.error('Failed to load base image.')
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl)
        objectUrlRef.current = null
      }
    }

    if (image instanceof File) {
      currentObjectUrl = URL.createObjectURL(image)
      objectUrlRef.current = currentObjectUrl
      baseImage.src = currentObjectUrl
    } else {
      console.warn('Image prop is not a File object.')
      if (ctx) {
        ctx.clearRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0)
      }
      setDownloadUrl(null)
    }

    return () => {
      // Cleanup
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
      if (document.body.style.overflowY !== originalBodyOverflowY.current) {
        document.body.style.overflowY = originalBodyOverflowY.current
      }
    }
  }, [image, overlay, overlayPos, scale, isFullAsset])

  // --- Interaction Helper Functions ---
  const getCoords = useCallback(
    (e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const clientX =
        'touches' in e ? e.touches[0]?.clientX : (e as MouseEvent).clientX
      const clientY =
        'touches' in e ? e.touches[0]?.clientY : (e as MouseEvent).clientY
      if (clientX === undefined || clientY === undefined) return null
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      }
    },
    []
  )

  const isWithinOverlay = useCallback(
    (x: number, y: number): boolean => {
      if (isFullAsset) return false
      const canvas = canvasRef.current
      if (!canvas) return false
      const overlayDrawSize = scale * canvas.width * 0.3
      return (
        x >= overlayPos.x &&
        x <= overlayPos.x + overlayDrawSize &&
        y >= overlayPos.y &&
        y <= overlayPos.y + overlayDrawSize
      )
    },
    [scale, overlayPos.x, overlayPos.y, isFullAsset]
  )

  // --- Start Drag Action ---
  const startDragging = useCallback(() => {
    if (!isDragging) {
      setIsDragging(true)
      originalBodyOverflowY.current = document.body.style.overflowY
      document.body.style.overflowY = 'hidden' // 수정: scroll → hidden (페이지 스크롤 완전히 방지)
    }
  }, [isDragging])

  // --- Event Handlers (수정됨) ---
  const handleInteractionStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isFullAsset) return
      const coords = getCoords(e.nativeEvent)

      if (coords && isWithinOverlay(coords.x, coords.y)) {
        // 에셋 내부에서 시작
        touchStartedOnAsset.current = true // 플래그 설정

        // 중요: 터치 이벤트인 경우 기본 동작 방지
        if ('touches' in e.nativeEvent) {
          e.preventDefault() // 터치 시작 시점에서 기본 동작 방지
        }

        dragStartOffset.current = {
          x: coords.x - overlayPos.x,
          y: coords.y - overlayPos.y,
        }

        if ('touches' in e.nativeEvent) {
          if (longPressTimer.current) clearTimeout(longPressTimer.current)
          longPressTimer.current = setTimeout(() => {
            startDragging()
            longPressTimer.current = null
          }, 400)
        } else {
          startDragging()
        }
      } else {
        // 에셋 외부에서 시작
        touchStartedOnAsset.current = false // 플래그 해제
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
      }
    },
    [
      isFullAsset,
      getCoords,
      isWithinOverlay,
      overlayPos.x,
      overlayPos.y,
      startDragging,
    ]
  )

  const handleInteractionMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // 터치 이벤트이고 에셋 위에서 시작된 경우 기본 동작 방지
      if ('touches' in e.nativeEvent && touchStartedOnAsset.current) {
        e.preventDefault() // 터치 이동 중에도 기본 동작 방지
      }

      // 드래그 중이 아니거나 전체 에셋인 경우 위치 업데이트 안 함
      if (!isDragging || isFullAsset) return

      const coords = getCoords(e.nativeEvent)
      if (!coords) return

      let newX = coords.x - dragStartOffset.current.x
      let newY = coords.y - dragStartOffset.current.y

      const canvas = canvasRef.current
      if (canvas) {
        const overlayDrawSize = scale * canvas.width * 0.3
        const allowanceFactor = 0.25 // 허용 범위
        const allowance = overlayDrawSize * allowanceFactor
        const minX = -allowance
        const minY = -allowance
        const maxX = canvas.width - overlayDrawSize + allowance
        const maxY = canvas.height - overlayDrawSize + allowance
        newX = Math.max(minX, Math.min(newX, maxX))
        newY = Math.max(minY, Math.min(newY, maxY))
      }
      setOverlayPos({ x: newX, y: newY })
    },
    [isDragging, isFullAsset, getCoords, scale]
  )

  const handleInteractionEnd = useCallback(() => {
    // 터치 종료 시 ref 초기화
    touchStartedOnAsset.current = false // 플래그 해제

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (isDragging) {
      setIsDragging(false)
      document.body.style.overflowY = originalBodyOverflowY.current
    }
  }, [isDragging])

  // Canvas 요소에 대한 passive: false 설정을 위한 useEffect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const touchStartHandler = (e: TouchEvent) => {
      const coords = getCoords(e)
      if (coords && isWithinOverlay(coords.x, coords.y)) {
        e.preventDefault()
      }
    }

    const touchMoveHandler = (e: TouchEvent) => {
      if (touchStartedOnAsset.current || isDragging) {
        e.preventDefault()
      }
    }

    // passive: false로 이벤트 리스너 추가 (브라우저에게 preventDefault()를 호출할 수 있음을 알림)
    canvas.addEventListener('touchstart', touchStartHandler, { passive: false })
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false })

    return () => {
      canvas.removeEventListener('touchstart', touchStartHandler)
      canvas.removeEventListener('touchmove', touchMoveHandler)
    }
  }, [getCoords, isWithinOverlay, isDragging])

  // --- Render ---
  return (
    <div className="mt-1 text-center select-none">
      <h2 className="text-base font-semibold mb-3">미리보기</h2>
      <div className="mx-auto w-full max-w-[360px] overflow-hidden bg-gray-50 border border-gray-200 rounded-2xl shadow-sm px-4 py-5">
        {isMobile && !isFullAsset && (
          <p className="mb-2 text-xs text-gray-500">
            📍 에셋(1초)을 길게 누르면 이동할 수 있어요
          </p>
        )}

        <div className="relative w-full max-w-[320px] mx-auto">
          <canvas
            ref={canvasRef}
            onMouseDown={handleInteractionStart}
            onMouseMove={handleInteractionMove}
            onMouseUp={handleInteractionEnd}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchMove={handleInteractionMove}
            onTouchEnd={handleInteractionEnd}
            onTouchCancel={handleInteractionEnd}
            className={`block w-full max-w-full border border-gray-300 rounded bg-white ${
              isFullAsset ? 'cursor-default' : 'cursor-move'
            } transition-all duration-200 ease-out`}
            style={{ touchAction: isFullAsset ? 'auto' : 'none' }} // 추가: touchAction 명시적 설정
          />
          {isDragging && (
            <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none rounded opacity-75" />
          )}
        </div>

        {!isFullAsset && (
          <div className="flex flex-col items-center gap-1 mt-4">
            <label htmlFor="scale-slider" className="text-sm text-gray-600">
              크기 조절
            </label>
            <input
              id="scale-slider"
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
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="block no-underline hover:no-underline w-full text-center px-4 py-2 text-sm text-gray-800 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition cursor-pointer"
            >
              사진 다시 올리기
            </button>
            <a
              href={downloadUrl}
              download="campaign-image.png"
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
