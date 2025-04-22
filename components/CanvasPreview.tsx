import React, { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  image: File
  overlay: string
  onDownload?: () => void
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

export default function CanvasPreview({ image, overlay, onDownload }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [overlayPos, setOverlayPos] = useState(() => getInitialPos(overlay))
  const [scale, setScale] = useState(() => getInitialScale(overlay))
  const [rotation, setRotation] = useState<number>(0) // ✅ 회전 상태 추가 (단위: 도)
  const [isDragging, setIsDragging] = useState(false)

  const dragStartOffset = useRef({ x: 0, y: 0 })
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const originalBodyOverflowY = useRef<string>('')

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

        // Draw Base Image (Cropped to Square)
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

        // Draw Overlay Image
        if (isFullAsset) {
          ctx.drawImage(overlayImg, 0, 0, exportSize, exportSize)
        } else {
          const overlayDrawSize = scale * exportSize * 0.3
          const centerX = overlayPos.x + overlayDrawSize / 2
          const centerY = overlayPos.y + overlayDrawSize / 2

          ctx.save() // ✅ 현재 캔버스 상태 저장
          ctx.translate(centerX, centerY) // ✅ 캔버스 원점을 에셋 중심으로 이동
          ctx.rotate((rotation * Math.PI) / 180) // ✅ 회전 적용 (라디안 단위)
          ctx.drawImage(
            overlayImg,
            -overlayDrawSize / 2, // ✅ 이동된 원점 기준으로 이미지 그리기 (중앙 정렬)
            -overlayDrawSize / 2,
            overlayDrawSize,
            overlayDrawSize
          )
          ctx.restore() // ✅ 이전 캔버스 상태 복원 (translate, rotate 해제)
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
      if (
        isMobile && // 모바일에서만 복원 로직 실행
        document.body.style.overflowY !== originalBodyOverflowY.current
      ) {
        document.body.style.overflowY = originalBodyOverflowY.current
      }
    }
    // ✅ rotation을 의존성 배열에 추가
  }, [image, overlay, overlayPos, scale, rotation, isFullAsset, isMobile]) // isMobile 추가

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

  // isWithinOverlay는 회전을 고려하지 않은 원래의 사각형 영역을 기준으로 합니다.
  // 드래그 시작 판정에는 이 방식이 더 직관적일 수 있습니다.
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
      if (isMobile) {
        originalBodyOverflowY.current = document.body.style.overflowY
        document.body.style.overflowY = 'hidden'
      }
    }
  }, [isDragging, isMobile])

  // --- Event Handlers ---
  const handleInteractionStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isFullAsset) return
      const coords = getCoords(e.nativeEvent)

      if (coords && isWithinOverlay(coords.x, coords.y)) {
        touchStartedOnAsset.current = true

        if ('touches' in e.nativeEvent) {
          // e.preventDefault(); // passive: false 리스너에서 처리하도록 주석 처리
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
        touchStartedOnAsset.current = false
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
      // passive: false 리스너에서 처리하므로 주석 처리
      // if ('touches' in e.nativeEvent && touchStartedOnAsset.current) {
      //   e.preventDefault();
      // }

      if (!isDragging || isFullAsset) return

      const coords = getCoords(e.nativeEvent)
      if (!coords) return

      let newX = coords.x - dragStartOffset.current.x
      let newY = coords.y - dragStartOffset.current.y

      const canvas = canvasRef.current
      if (canvas) {
        const overlayDrawSize = scale * canvas.width * 0.3
        // 경계 제한 로직은 회전되지 않은 바운딩 박스 기준으로 유지
        const allowanceFactor = 0.25
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
    touchStartedOnAsset.current = false

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (isDragging) {
      setIsDragging(false)
      if (isMobile && originalBodyOverflowY.current !== undefined) {
        // 복원 조건 명확화
        document.body.style.overflowY = originalBodyOverflowY.current
        originalBodyOverflowY.current = '' // 참조 초기화
      }
    }
  }, [isDragging, isMobile])

  // --- Passive Event Listener Setup ---
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || isFullAsset) return // 전체 에셋일 경우 터치 제어 불필요

    // 핸들러 내부에서 최신 상태를 참조하도록 수정 (useCallback 대신 직접 정의)
    const touchStartHandler = (e: TouchEvent) => {
      const currentCoords = getCoords(e)
      // isWithinOverlay 호출 시 최신 scale, overlayPos 사용
      if (currentCoords && isWithinOverlay(currentCoords.x, currentCoords.y)) {
        e.preventDefault()
      }
    }

    const touchMoveHandler = (e: TouchEvent) => {
      // isDragging 상태를 직접 참조
      if (touchStartedOnAsset.current || isDragging) {
        e.preventDefault()
      }
    }

    canvas.addEventListener('touchstart', touchStartHandler, { passive: false })
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false })

    return () => {
      canvas.removeEventListener('touchstart', touchStartHandler)
      canvas.removeEventListener('touchmove', touchMoveHandler)
    }
    // ✅ isDragging, getCoords, isWithinOverlay, isFullAsset 추가 (핸들러가 최신 상태 참조하도록)
  }, [getCoords, isWithinOverlay, isDragging, isFullAsset])

  // --- Rotation Handlers ---
  const handleRotate = useCallback((degreeDelta: number) => {
    setRotation((prev) => (prev + degreeDelta + 360) % 360) // 0~359도 유지
  }, [])

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
            // passive 리스너를 사용하므로 touchAction 제거 또는 auto 유지 가능
            style={{ touchAction: isFullAsset ? 'auto' : 'manipulation' }} // 'none' 대신 'manipulation'으로 변경하여 브라우저 기본 확대/축소 등은 가능하게 할 수 있음
          />
          {isDragging && (
            <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none rounded opacity-75" />
          )}
        </div>

        {!isFullAsset && (
          <div className="mt-4 space-y-3">
            {' '}
            {/* ✅ 간격 조절을 위해 space-y 추가 */}
            {/* --- 크기 조절 --- */}
            <div className="flex flex-col items-center gap-1">
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
                className="w-full h-6 accent-blue-600 touch-pan-y cursor-pointer" // touch-pan-y 추가
              />
            </div>
            {/* --- 회전 조절 --- */}
            <div className="flex flex-col items-center gap-2">
              {' '}
              {/* ✅ gap 추가 */}
              <span className="text-sm text-gray-600">이미지 회전</span>
              <div className="flex justify-center gap-3">
                {' '}
                {/* ✅ 버튼 간격 */}
                <button
                  type="button"
                  onClick={() => handleRotate(-15)} // 15도씩 회전
                  className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                  aria-label="왼쪽으로 회전"
                >
                  ↺ 좌
                </button>
                <button
                  type="button"
                  onClick={() => handleRotate(15)} // 15도씩 회전
                  className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                  aria-label="오른쪽으로 회전"
                >
                  ↻ 우
                </button>
                {/* Optional: Reset Rotation Button */}
                <button
                  type="button"
                  onClick={() => setRotation(0)}
                  disabled={rotation === 0} // 회전 안됐으면 비활성화
                  className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="회전 초기화"
                >
                  Reset
                </button>
              </div>
            </div>
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
              onClick={onDownload} // 이미 함수 참조이므로 람다 제거 가능
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
