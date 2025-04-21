'use client'

import CanvasPreview from '@/components/CanvasPreview'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

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
}

export default function Step2_PreviewAndDownload({
  image,
  overlayFile,
  setOverlayFile,
}: Props) {
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    const alreadyLogged = sessionStorage.getItem('final-logged')
    if (alreadyLogged || downloaded) return

    const logFinal = async () => {
      try {
        await supabase.from('image_creations').insert({
          asset: overlayFile,
          anonymous_id: localStorage.getItem('anonymous_id'),
          user_agent: navigator.userAgent,
          stage: 'final',
        })
        sessionStorage.setItem('final-logged', 'true')
        setDownloaded(true)
      } catch (err) {
        console.error('최종 기록 실패:', err)
      }
    }

    logFinal()
  }, [overlayFile, downloaded])

  return (
    <div className="w-full">
      {/* 에셋 선택 가로 스크롤 */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-3">
          {labels.map((label, i) => {
            const asset = `asset${String(i + 1).padStart(2, '0')}.png`
            const selected = overlayFile === asset
            return (
              <button
                key={asset}
                onClick={() => setOverlayFile(asset)}
                className={`flex flex-col items-center justify-center w-24 shrink-0 p-2 rounded-xl border text-xs transition ${
                  selected
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                <Image
                  src={`/${asset}`}
                  alt={label}
                  width={48}
                  height={48}
                  className="mb-1"
                />
                <span className="text-center whitespace-pre-line leading-tight">
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 이미지 미리보기 */}
      <div className="max-w-md mx-auto mt-6">
        <CanvasPreview image={image} overlay={overlayFile} />
        <p className="text-center text-xs text-gray-400 mt-6">
          🔒 이미지는 브라우저에서만 처리되며, 서버에 저장되지 않습니다.
        </p>
      </div>
    </div>
  )
}
