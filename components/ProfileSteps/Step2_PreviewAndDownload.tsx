'use client'

import CanvasPreview from '@/components/CanvasPreview'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { useRef, useEffect } from 'react'
const labels: string[] = [
  '무지개 머리띠',
  '투쟁 머리띠',
  '동지 머리띠',
  '평등 머리띠',
  '무지개 손깃발',
  '트랜스 손깃발',
  '수호동지 버튼',
  '무지개 반짝이',
  '민주주의 지키는\n성소수자',
  '성소수자 지키는\n민주주의',
]

type Props = {
  image: File
  overlayFile: string
  setOverlayFile: (file: string) => void
  onReset: () => void // 👈 추가
}

export default function Step2_PreviewAndDownload({
  image,
  overlayFile,
  setOverlayFile,
  onReset,
}: Props) {
  const handleDownloadLog = async () => {
    try {
      await supabase.from('image_creations').insert({
        asset: overlayFile,
        anonymous_id: localStorage.getItem('anonymous_id'),
        user_agent: navigator.userAgent,
        stage: 'downloaded',
      })
    } catch (err) {
      console.error('다운로드 기록 실패:', err)
    }
  }

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const timeout = setTimeout(() => {
      const selectedIndex = labels.findIndex(
        (_, i) => overlayFile === `asset${String(i + 1).padStart(2, '0')}.png`
      )
      const selectedRef = buttonRefs.current[selectedIndex]
      if (selectedRef) {
        selectedRef.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        })
      }
    }, 50) // DOM 렌더링 완료를 기다리기 위한 약간의 딜레이

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // ← 빈 배열로 최초 진입 시 1회만 실행

  return (
    <div className="w-full">
      <div className="overflow-x-auto pb-2 custom-scrollbar">
        <div className="flex gap-3">
          {labels.map((label, i) => {
            const asset = `asset${String(i + 1).padStart(2, '0')}.png`
            const selected = overlayFile === asset
            return (
              <button
                key={asset}
                ref={(el: HTMLButtonElement | null) => {
                  buttonRefs.current[i] = el
                }}
                onClick={() => setOverlayFile(asset)}
                className={`flex flex-col items-center justify-center w-24 shrink-0 p-2 rounded-xl border text-xs transition ${
                  selected
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Image
                  src={`/${asset}`}
                  alt={label}
                  width={48}
                  height={48}
                  className="mb-1"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
                <span className="text-center whitespace-pre-line leading-tight">
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-md mx-auto mt-6">
        <CanvasPreview
          image={image}
          overlay={overlayFile}
          onDownload={handleDownloadLog}
          onReset={onReset}
        />
      </div>
    </div>
  )
}
