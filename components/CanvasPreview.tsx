// CanvasPreview.tsx (통합: 기존 기능 + 배경 조정 추가)
'use client'

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

export default function CanvasPreview({ image, overlay, onDownload, onReset }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [overlayPos, setOverlayPos] = useState(() => getInitialPos(overlay))
  const [scale, setScale] = useState<number>(1.8)
  const [rotation, setRotation] = useState<number>(0)
  const [bgScale, setBgScale] = useState(1)
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 })

  const isFullAsset = isFullAssetOverlay(overlay)

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
      overlayImg.src = '/' + overlay
    }

    if (image instanceof File) {
      currentObjectUrl = URL.createObjectURL(image)
      baseImage.src = currentObjectUrl
    }

    return () => {
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
    }
  }, [image, overlay, overlayPos, scale, rotation, bgScale, bgOffset])

  return (
    <div className="mt-1 text-center select-none">
      <div className="mx-auto w-full max-w-[360px] overflow-hidden bg-gray-50 border border-gray-200 rounded-2xl px-4 py-5">
        <div className="relative w-full max-w-[320px] mx-auto">
          <canvas ref={canvasRef} className="block w-full border border-gray-300 rounded bg-white" />
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-col items-center gap-1">
            <label htmlFor="scale-slider" className="text-sm text-gray-600 font-medium">
              에셋 크기 조절
            </label>
            <input
              id="scale-slider"
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-6 accent-blue-600"
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">에셋 회전</span>
            <div className="flex justify-center gap-3">
              <button onClick={() => setRotation((r) => (r - 10 + 360) % 360)} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">
                ↺ 좌
              </button>
              <button onClick={() => setRotation((r) => (r + 10) % 360)} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">
                ↻ 우
              </button>
              <button onClick={() => setRotation(0)} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">
                초기화
              </button>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <p className="text-sm text-gray-600 font-medium">배경 조절</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => setBgScale((s) => Math.min(s + 0.1, 2.5))} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                배경 확대
              </button>
              <button onClick={() => setBgScale((s) => Math.max(s - 0.1, 0.5))} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                배경 축소
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 justify-items-center text-lg">
              <button onClick={() => setBgOffset((o) => ({ ...o, y: o.y - 10 }))}>⬆️</button>
              <div />
              <button onClick={() => setBgOffset((o) => ({ ...o, y: o.y + 10 }))}>⬇️</button>
              <button onClick={() => setBgOffset((o) => ({ ...o, x: o.x - 10 }))}>⬅️</button>
              <div />
              <button onClick={() => setBgOffset((o) => ({ ...o, x: o.x + 10 }))}>➡️</button>
            </div>
            <button
              onClick={() => {
                setBgScale(1)
                setBgOffset({ x: 0, y: 0 })
              }}
              className="w-full px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 transition"
            >
              배경 초기화
            </button>
          </div>

          <div className="pt-4">
            <a
              href={downloadUrl ?? '#'}
              download="rainbowaction-profile.png"
              onClick={onDownload}
              className="block no-underline w-full text-center px-4 py-2.5 text-sm text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              이미지 다운로드
            </a>
            <button
              type="button"
              onClick={onReset}
              className="mt-3 block no-underline w-full text-center px-4 py-2 text-sm text-gray-800 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition"
            >
              사진 다시 고르기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
