import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  image: File
  overlay: string
  onDownload?: () => void
  onReset?: () => void
}

const getInitialPos = (overlay: string): { x: number; y: number } => {
  if (overlay === 'asset01.png') return { x: 240, y: 30 }
  return { x: 240, y: 240 }
}

const isFullAssetOverlay = (overlay: string): boolean => {
  return ['asset08.png', 'asset09.png', 'asset10.png'].includes(overlay)
}

export default function CanvasPreview({
  image,
  overlay,
  onDownload,
  onReset,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [overlayPos, setOverlayPos] = useState(() => getInitialPos(overlay))
  const [scale, setScale] = useState<number>(1.8)
  const [rotation, setRotation] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [bgScale, setBgScale] = useState(1)
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 })

  const dragStartOffset = useRef({ x: 0, y: 0 })
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const originalBodyOverflowY = useRef<string>('')

  const touchStartedOnAsset = useRef(false)

  const isFullAsset = isFullAssetOverlay(overlay)
  const isMobile =
    typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)

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
        const scaledSize = exportSize * bgScale
        ctx.drawImage(
          baseImage,
          sx,
          sy,
          shortSide,
          shortSide,
          (exportSize - scaledSize) / 2 + bgOffset.x,
          (exportSize - scaledSize) / 2 + bgOffset.y,
          scaledSize,
          scaledSize
        )

        if (isFullAsset) {
          ctx.drawImage(overlayImg, 0, 0, exportSize, exportSize)
        } else {
          const overlayDrawSize = scale * exportSize * 0.3
          const centerX = overlayPos.x + overlayDrawSize / 2
          const centerY = overlayPos.y + overlayDrawSize / 2

          ctx.save()
          ctx.translate(centerX, centerY)
          ctx.rotate((rotation * Math.PI) / 180)
          ctx.drawImage(
            overlayImg,
            -overlayDrawSize / 2,
            -overlayDrawSize / 2,
            overlayDrawSize,
            overlayDrawSize
          )
          ctx.restore()
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
        isMobile &&
        document.body.style.overflowY !== originalBodyOverflowY.current
      ) {
        document.body.style.overflowY = originalBodyOverflowY.current
      }
    }
  }, [
    image,
    overlay,
    overlayPos,
    scale,
    rotation,
    isFullAsset,
    isMobile,
    bgScale,
    bgOffset,
  ])

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

  const startDragging = useCallback(() => {
    if (!isDragging) {
      setIsDragging(true)
      if (isMobile) {
        originalBodyOverflowY.current = document.body.style.overflowY
        document.body.style.overflowY = 'hidden'
      }
    }
  }, [isDragging, isMobile])

  const handleInteractionStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isFullAsset) return
      const coords = getCoords(e.nativeEvent)

      if (coords && isWithinOverlay(coords.x, coords.y)) {
        touchStartedOnAsset.current = true

        if ('touches' in e.nativeEvent) {
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
      if (!isDragging || isFullAsset) return

      const coords = getCoords(e.nativeEvent)
      if (!coords) return

      let newX = coords.x - dragStartOffset.current.x
      let newY = coords.y - dragStartOffset.current.y

      const canvas = canvasRef.current
      if (canvas) {
        const overlayDrawSize = scale * canvas.width * 0.3
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
        document.body.style.overflowY = originalBodyOverflowY.current
        originalBodyOverflowY.current = ''
      }
    }
  }, [isDragging, isMobile])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || isFullAsset) return

    const touchStartHandler = (e: TouchEvent) => {
      const currentCoords = getCoords(e)
      if (currentCoords && isWithinOverlay(currentCoords.x, currentCoords.y)) {
        e.preventDefault()
      }
    }

    const touchMoveHandler = (e: TouchEvent) => {
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
  }, [getCoords, isWithinOverlay, isDragging, isFullAsset])

  const handleRotate = useCallback((degreeDelta: number) => {
    setRotation((prev) => (prev + degreeDelta + 360) % 360)
  }, [])

  const dataURLtoBlob = (dataurl: string): Blob | null => {
    try {
      const arr = dataurl.split(',')
      if (!arr[0]) return null
      const match = arr[0].match(/:(.*?);/)
      if (!match) return null
      const mime = match[1]
      const bstr = atob(arr[arr.length - 1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new Blob([u8arr], { type: mime })
    } catch (e) {
      console.error('Error converting data URL to Blob:', e)
      return null
    }
  }
  const handleNativeShare = useCallback(async () => {
    if (!downloadUrl) {
      alert('이미지를 생성 중이거나 오류가 발생했습니다.')
      return
    }

    if (!navigator.share) {
      alert(
        '이 브라우저/기기에서는 공유 기능을 지원하지 않습니다. 이미지를 다운로드하여 공유해주세요.'
      )
      return
    }

    setIsSharing(true)

    const blob = dataURLtoBlob(downloadUrl)
    if (!blob) {
      alert('이미지 변환 중 오류가 발생했습니다.')
      setIsSharing(false)
      return
    }

    const file = new File([blob], 'rainbowaction-profile.png', {
      type: 'image/png',
    })

    const shareUrl = 'https://profile.rainbowaction.kr/?ref=share'
    const shareData = {
      files: [file],
      title: '나의 수호동지 프로필',
      text: '나의 수호동지 프로필 이미지를 공유합니다!',
      url: shareUrl,
    }

    try {
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        console.log('이미지 공유 성공')
      } else if (!navigator.canShare) {
        await navigator.share(shareData)
        console.log('이미지 공유 성공 (canShare not supported)')
      } else {
        alert(
          '이 이미지 파일은 공유할 수 없습니다. 다운로드 후 직접 공유해주세요.'
        )
        return
      }

      await supabase.from('image_creations').insert({
        asset: overlay,
        anonymous_id: localStorage.getItem('anonymous_id'),
        user_agent: navigator.userAgent,
        stage: 'shared',
      })
    } catch (error) {
      console.error('이미지 공유 실패:', error)
      if (error instanceof Error && error.name !== 'AbortError') {
        alert(`공유 중 오류가 발생했습니다: ${error.message}`)
      }
    } finally {
      setIsSharing(false)
    }
  }, [downloadUrl, overlay])

  const platformInfo = useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return { isPC: true, isIOS: false, isAndroid: false, canShare: false }
    }

    const userAgent = navigator.userAgent
    const platform = navigator.platform
    const maxTouchPoints = navigator.maxTouchPoints || 0

    const isIOS =
      /iPhone|iPad|iPod/i.test(userAgent) ||
      (platform === 'MacIntel' && maxTouchPoints > 1)

    const isAndroid = /Android/i.test(userAgent)
    const isMobile = isIOS || isAndroid
    const isPC = !isMobile
    const canShare = !!navigator.share

    return {
      isPC,
      isIOS,
      isAndroid,
      isMobile,
      canShare,
    }
  }, [])

  const ShareButton = ({ text }: { text: string }) => (
    <button
      type="button"
      onClick={handleNativeShare}
      disabled={isSharing}
      className="block no-underline hover:no-underline w-full text-center px-4 py-2.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition border border-blue-600 disabled:opacity-60 disabled:cursor-wait"
    >
      <strong>{isSharing ? '공유 준비 중...' : text}</strong>
    </button>
  )

  const DownloadButton = () => (
    <a
      href={downloadUrl!}
      download="rainbowaction-profile.png"
      onClick={onDownload}
      className={`block no-underline hover:no-underline w-full text-center px-4 py-2.5 text-sm text-white bg-gray-800 rounded-lg hover:bg-gray-700 hover:text-white transition border border-gray-800 ${
        isSharing ? 'opacity-60 pointer-events-none' : 'cursor-pointer'
      }`}
      aria-disabled={isSharing}
    >
      <strong>이미지 다운로드</strong>
    </a>
  )

  // --- Render ---
  return (
    <div className="mt-1 text-center select-none">
      <div className="mx-auto w-full max-w-[360px] overflow-hidden bg-gray-50 border border-gray-200 rounded-2xl px-4 py-5">
        {!isFullAsset && (
          <p className="mb-2 text-xs text-gray-500">
            📌{' '}
            {isMobile
              ? '스티커를 꾹(1초 이상) 눌러 마음에 드는 위치로 옮겨보세요!'
              : '스티커를 마우스로 드래그해 마음에 드는 위치로 옮겨보세요!'}
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
            role="img"
            aria-label="꾸며진 프로필 이미지 미리보기"
            className={`block w-full max-w-full border border-gray-300 rounded bg-white ${
              isFullAsset ? 'cursor-default' : 'cursor-move'
            } transition-all duration-200 ease-out`}
            style={{ touchAction: isFullAsset ? 'auto' : 'manipulation' }}
          />
          {isDragging && (
            <div className="absolute inset-0 border-2 border-[#e1a8bd] pointer-events-none rounded opacity-75" />
          )}
        </div>
        <div className="mt-4 space-y-4">
          {!isFullAsset && (
            <>
              <div className="flex flex-col items-center gap-2">
                <label
                  htmlFor="scale-slider"
                  className="text-sm text-gray-600 font-medium"
                >
                  스티커 크기 조절
                </label>
                <input
                  id="scale-slider"
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full h-6 accent-blue-600 touch-pan-y cursor-pointer"
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">
                  스티커 회전
                </span>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleRotate(-10)}
                    className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                    aria-label="왼쪽으로 회전"
                  >
                    ↺ 좌
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRotate(10)}
                    className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                    aria-label="오른쪽으로 회전"
                  >
                    ↻ 우
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation(0)}
                    disabled={rotation === 0}
                    className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="회전 초기화"
                  >
                    초기화
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">
              배경 이미지 조절
            </span>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setBgScale((s) => Math.min(s + 0.1, 2.5))}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
              >
                + 확대
              </button>
              <button
                onClick={() => {
                  if (bgScale > 1) {
                    setBgScale((s) => Math.max(s - 0.1, 1))
                  }
                }}
                disabled={bgScale <= 1}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                - 축소
              </button>
              <button
                onClick={() => {
                  setBgScale(1)
                  setBgOffset({ x: 0, y: 0 })
                }}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition "
              >
                초기화
              </button>
            </div>
            <div className="flex justify-center flex-wrap gap-2">
              <button
                onClick={() => setBgOffset((o) => ({ ...o, y: o.y - 10 }))}
                disabled={bgScale === 1}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="배경 위로 이동"
              >
                ⬆️
              </button>
              <button
                onClick={() => setBgOffset((o) => ({ ...o, y: o.y + 10 }))}
                disabled={bgScale === 1}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="배경 아래로 이동"
              >
                ⬇️
              </button>
              <button
                onClick={() => setBgOffset((o) => ({ ...o, x: o.x - 10 }))}
                disabled={bgScale === 1}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="배경 왼쪽으로 이동"
              >
                ⬅️
              </button>
              <button
                onClick={() => setBgOffset((o) => ({ ...o, x: o.x + 10 }))}
                disabled={bgScale === 1}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="배경 오른쪽으로 이동"
              >
                ➡️
              </button>
            </div>
          </div>
        </div>

        {downloadUrl && (
          <div className="mt-5 space-y-3">
            <hr />

            {platformInfo.isPC && (
              <>
                <DownloadButton />
                {platformInfo.canShare && <ShareButton text="공유하기" />}
              </>
            )}

            {platformInfo.isIOS && (
              <>
                {platformInfo.canShare && (
                  <ShareButton text="공유하기(사진첩 저장하기)" />
                )}
                <DownloadButton />
                <p className="text-xs text-center text-gray-500 mt-3">
                  일부 앱 내 브라우저에서는 다운로드가 제한될 수 있어요.
                  <br />
                  <a
                    href={
                      typeof window !== 'undefined' ? window.location.href : '/'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 font-medium"
                  >
                    외부 브라우저
                  </a>
                  에서 다시 접속해주세요.
                </p>
              </>
            )}

            {platformInfo.isAndroid && (
              <>
                {platformInfo.canShare && (
                  <ShareButton text="공유하기(이미지 복사하기)" />
                )}
                <DownloadButton />
                <p className="text-xs text-center text-gray-500 mt-3">
                  일부 앱 내 브라우저에서는 다운로드가 제한될 수 있어요.
                  <br />
                  <a
                    href={
                      typeof window !== 'undefined' ? window.location.href : '/'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 font-medium"
                  >
                    외부 브라우저
                  </a>
                  에서 다시 접속해 주세요.
                </p>
              </>
            )}

            <hr />
            <button
              type="button"
              onClick={onReset}
              className="block no-underline hover:no-underline w-full text-center px-4 py-2 text-sm text-gray-800 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
              disabled={isSharing}
            >
              사진 다시 고르기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
