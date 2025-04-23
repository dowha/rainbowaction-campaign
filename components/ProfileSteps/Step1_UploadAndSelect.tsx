'use client'

import { useEffect } from 'react'
import Uploader from '@/components/Uploader'
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
  image: File | null
  setImage: (file: File | null) => void
  setOverlayFile: (file: string) => void
  overlayFile: string
  onNext: () => void
}

export default function Step1_UploadAndSelect({
  image,
  setImage,
  overlayFile,
  setOverlayFile,
  onNext,
}: Props) {
  useEffect(() => {
    if (!localStorage.getItem('anonymous_id')) {
      localStorage.setItem('anonymous_id', crypto.randomUUID())
    }
  }, [])

  const handleProceed = async () => {
    await supabase.from('image_creations').insert({
      asset: overlayFile,
      anonymous_id: localStorage.getItem('anonymous_id'),
      user_agent: navigator.userAgent,
      stage: 'selected',
    })
    onNext()
  }

  return (
    <div className="w-full">
      <Uploader
        onSelect={(file) => {
          setImage(file)
          setOverlayFile('asset01.png') // 기본 에셋
        }}
        onClear={() => {
          setImage(null)
          setOverlayFile('')
        }}
      />

      {image && (
        <>
          <div className="grid grid-cols-2 gap-3 my-6 animate-fade">
            {labels.map((label, i) => {
              const asset = `asset${String(i + 1).padStart(2, '0')}.png`
              const selected = overlayFile === asset
              return (
                <button
                  key={asset}
                  onClick={() => setOverlayFile(asset)}
                  className={`relative w-full h-28 rounded-xl border p-1 text-xs font-medium flex flex-col items-center justify-between text-center transition overflow-hidden ${
                    selected
                      ? 'border-blue-500 bg-blue-50 text-gray-700 shadow-sm'
                      : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="relative w-12 h-12 mt-1">
                    <Image
                      src={`/${asset}`}
                      alt={label}
                      fill
                      className="object-contain"
                      sizes="48px"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </div>
                  <span className="whitespace-pre-line leading-tight min-h-[2.75rem] flex items-center justify-center mb-1">
                    {label}
                  </span>

                  {selected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation() // 중요: 이벤트 버블링 방지
                          handleProceed()
                        }}
                        className="px-4 py-1.5 bg-blue-600 bg-opacity-90 text-white text-xs rounded-full hover:bg-blue-700 transition shadow-md z-10" // 크기, z-index 등 조정
                      >
                        ✅ 꾸미기 시작하기
                      </button>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
