import React, { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  image: File
  overlay: string
}

// Helper functions defined outside the component to avoid recreation on render
const getInitialPos = (overlay: string): { x: number; y: number } => {
  // Example: Specific initial position for asset01
  if (overlay === 'asset01.png') {
    return { x: 240, y: 30 }
  }
  // Default position
  return { x: 240, y: 240 }
}

const getInitialScale = (overlay: string): number => {
  // Example: Specific initial scale for asset01
  if (overlay === 'asset01.png') {
    return 1.8
  }
  // Default scale
  return 1
}

const isFullAssetOverlay = (overlay: string): boolean => {
  return ['asset08.png', 'asset09.png', 'asset10.png'].includes(overlay)
}

export default function CanvasPreview({ image, overlay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [overlayPos, setOverlayPos] = useState(() => getInitialPos(overlay))
  const [scale, setScale] = useState(() => getInitialScale(overlay))
  const [isDragging, setIsDragging] = useState(false)

  const dragStartOffset = useRef({ x: 0, y: 0 }) // Renamed for clarity
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const objectUrlRef = useRef<string | null>(null) // To store object URL for cleanup

  const isFullAsset = isFullAssetOverlay(overlay)
  const isMobile =
    typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)

  // --- Canvas Drawing Effect ---
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const exportSize = 720 // Desired output size

    const baseImage = new Image()
    const overlayImg = new Image()
    let currentObjectUrl: string | null = null

    baseImage.onload = () => {
      // Revoke previous object URL if it exists
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }

      overlayImg.onload = () => {
        // Set canvas physical and logical size
        canvas.width = exportSize
        canvas.height = exportSize
        // Use CSS for display size if needed (already handled by className 'w-full')
        // canvas.style.width = '100%';
        // canvas.style.height = 'auto';

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // --- Draw Base Image (Cropped to Square) ---
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

        // --- Draw Overlay Image ---
        if (isFullAsset) {
          ctx.drawImage(overlayImg, 0, 0, exportSize, exportSize)
        } else {
          // Calculate overlay size based on scale and canvas size
          const overlayDrawSize = scale * exportSize * 0.3 // 30% of canvas size base
          ctx.drawImage(
            overlayImg,
            overlayPos.x,
            overlayPos.y,
            overlayDrawSize,
            overlayDrawSize
          )
        }

        // --- Generate Download URL ---
        setDownloadUrl(canvas.toDataURL('image/png'))
      }
      overlayImg.onerror = () => {
        console.error(`Failed to load overlay image: /${overlay}`)
        // Handle error appropriately, maybe show a message
      }
      overlayImg.src = '/' + overlay // Assuming overlays are in public folder
    }

    baseImage.onerror = () => {
      console.error('Failed to load base image.')
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl) // Clean up even on error
        objectUrlRef.current = null
      }
      // Handle error appropriately
    }

    // Create object URL only if image is a File
    if (image instanceof File) {
      currentObjectUrl = URL.createObjectURL(image)
      objectUrlRef.current = currentObjectUrl // Store for potential cleanup
      baseImage.src = currentObjectUrl
    } else {
      // Handle cases where image might not be a file (e.g., empty state)
      console.warn('Image prop is not a File object.')
      // Optionally clear the canvas or show a placeholder
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setDownloadUrl(null)
    }

    // --- Cleanup ---
    // This cleanup runs when the component unmounts or dependencies change *before* the effect runs again
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
        console.log('Revoked Object URL on cleanup')
      }
      // Clear any lingering timers
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [image, overlay, overlayPos, scale, isFullAsset]) // Dependencies for redraw

  // --- Interaction Helper Functions ---

  const getCoords = useCallback(
    (e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current
      if (!canvas) return null

      const rect = canvas.getBoundingClientRect()
      // Use changedTouches for touchEnd/touchCancel if needed, otherwise touches[0]
      const clientX =
        'touches' in e ? e.touches[0]?.clientX : (e as MouseEvent).clientX
      const clientY =
        'touches' in e ? e.touches[0]?.clientY : (e as MouseEvent).clientY

      if (clientX === undefined || clientY === undefined) return null // Handle edge case (e.g., touch ended)

      // Calculate coordinates relative to the canvas, scaled to the canvas internal resolution
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const canvasX = (clientX - rect.left) * scaleX
      const canvasY = (clientY - rect.top) * scaleY

      return { x: canvasX, y: canvasY }
    },
    []
  ) // Empty dependency array as it relies on refs and DOM properties

  const isWithinOverlay = useCallback(
    (x: number, y: number): boolean => {
      if (isFullAsset) return false // Cannot drag full asset overlays

      const canvas = canvasRef.current
      if (!canvas) return false

      const overlayDrawSize = scale * canvas.width * 0.3 // Use actual canvas width
      return (
        x >= overlayPos.x &&
        x <= overlayPos.x + overlayDrawSize &&
        y >= overlayPos.y &&
        y <= overlayPos.y + overlayDrawSize
      )
    },
    [scale, overlayPos.x, overlayPos.y, isFullAsset]
  ) // Dependencies

  // --- Event Handlers ---

  const handleInteractionStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isFullAsset) return // Don't process drag for full overlays

      const coords = getCoords(e.nativeEvent)
      if (!coords || !isWithinOverlay(coords.x, coords.y)) {
        // If starting outside the overlay, do nothing
        return
      }

      // Prevent default actions like text selection or page scroll (especially for touch)
      if ('touches' in e.nativeEvent) {
        e.preventDefault()
      }

      dragStartOffset.current = {
        x: coords.x - overlayPos.x,
        y: coords.y - overlayPos.y,
      }

      // --- Long Press Logic for Touch ---
      if ('touches' in e.nativeEvent) {
        // Clear any existing timer
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
        }
        // Start new timer
        longPressTimer.current = setTimeout(() => {
          setIsDragging(true)
          // Disable body scroll *only when dragging actually starts*
          document.body.style.overflow = 'hidden'
          longPressTimer.current = null // Clear timer ref once fired
        }, 400) // 400ms delay for long press
      } else {
        // --- Immediate Drag for Mouse ---
        setIsDragging(true)
        document.body.style.overflow = 'hidden' // Prevent scroll during drag
      }
    },
    [isFullAsset, getCoords, isWithinOverlay, overlayPos.x, overlayPos.y] // Dependencies
  )

  const handleInteractionMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Only move if dragging is active (set by timer for touch, immediately for mouse)
      if (!isDragging || isFullAsset) return

      // Prevent scrolling during drag on mobile
      if ('touches' in e.nativeEvent) {
        e.preventDefault()
      }

      const coords = getCoords(e.nativeEvent)
      if (!coords) return // Exit if coordinates are invalid

      // Calculate new top-left position
      let newX = coords.x - dragStartOffset.current.x
      let newY = coords.y - dragStartOffset.current.y

      // (Optional) Add boundary checks if needed
      const canvas = canvasRef.current
      if (canvas) {
        const overlayDrawSize = scale * canvas.width * 0.3
        newX = Math.max(0, Math.min(newX, canvas.width - overlayDrawSize))
        newY = Math.max(0, Math.min(newY, canvas.height - overlayDrawSize))
      }

      setOverlayPos({ x: newX, y: newY })
    },
    [isDragging, isFullAsset, getCoords, scale] // Dependencies
  )

  const handleInteractionEnd = useCallback(() => {
    // Clear long press timer if it's still pending (touch ended before 400ms)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    // Reset dragging state only if it was actually set
    if (isDragging) {
      setIsDragging(false)
      document.body.style.overflow = '' // Re-enable body scroll
    }
    // No need to reset dragStartOffset here, it's set on next start
  }, [isDragging]) // Dependency on isDragging

  return (
    <div className="mt-1 text-center select-none">
      <h2 className="text-base font-semibold mb-3">미리보기</h2>

      <div className="mx-auto w-full max-w-[360px] overflow-hidden bg-gray-50 border border-gray-200 rounded-2xl shadow-sm px-4 py-5">
        {isMobile && !isFullAsset && (
          <p className="mb-2 text-xs text-gray-500">
            📍 에셋(1초)을 길게 누르면 이동할 수 있어요
          </p>
        )}

        {/* Canvas Container - Relative positioning might be needed if absolutely positioned elements are inside */}
        <div className="relative w-full max-w-[320px] mx-auto">
          <canvas
            ref={canvasRef}
            // Apply interaction handlers directly to the canvas
            onMouseDown={handleInteractionStart}
            onMouseMove={handleInteractionMove}
            onMouseUp={handleInteractionEnd}
            onMouseLeave={handleInteractionEnd} // End drag if mouse leaves canvas
            onTouchStart={handleInteractionStart}
            onTouchMove={handleInteractionMove}
            onTouchEnd={handleInteractionEnd}
            onTouchCancel={handleInteractionEnd} // End drag if touch is interrupted
            className={`block w-full max-w-full border border-gray-300 rounded bg-white ${
              isFullAsset ? 'cursor-default' : 'cursor-move'
            } transition-all duration-200 ease-out`}
            // Style to prevent browser's default touch actions like scrolling/zooming during interaction
            style={{ touchAction: !isFullAsset ? 'none' : 'auto' }}
          />
          {/* Optional: Add a visual indicator when dragging is active */}
          {isDragging && (
            <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none rounded" />
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
              // Use touch-none specifically on the slider to allow dragging it without page scroll
              className="w-full h-6 accent-blue-600 touch-none cursor-pointer"
            />
          </div>
        )}

        {downloadUrl && (
          <div className="mt-5 space-y-3">
            <button // Use button for actions where appropriate
              type="button"
              onClick={() => window.location.reload()} // Consider a less disruptive way to reset if possible
              className="block no-underline hover:no-underline w-full text-center px-4 py-2 text-sm text-gray-800 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition cursor-pointer"
            >
              사진 다시 올리기
            </button>
            <a
              href={downloadUrl}
              download="campaign-image.png"
              // target="_blank" // target blank not strictly needed for download attribute
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
