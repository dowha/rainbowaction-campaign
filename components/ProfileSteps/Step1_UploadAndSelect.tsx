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
  setImage: (file: File) => void
  overlayFile: string
  setOverlayFile: (file: string) => void
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
      stage: 'started',
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
      />

      {image && (
        <>
          <div className="grid grid-cols-2 gap-3 my-6">
            {labels.map((label, i) => {
              const asset = `asset${String(i + 1).padStart(2, '0')}.png`
              const selected = overlayFile === asset
              return (
                <button
                  key={asset}
                  onClick={() => setOverlayFile(asset)}
                  className={`w-full h-28 rounded-xl p-1 text-xs font-medium flex flex-col items-center justify-between text-center transition ${
                    selected
                      ? 'bg-blue-50 border-2 border-blue-500 text-blue-700 shadow-sm'
                      : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="relative w-12 h-12">
                    <Image
                      src={`/${asset}`}
                      alt={label}
                      fill
                      className="object-contain"
                      sizes="48px"
                    />
                  </div>
                  <span className="whitespace-pre-line leading-tight min-h-[2.75rem] flex items-center justify-center">
                    {label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleProceed}
              className="px-6 py-2 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition"
            >
              ✅ 이걸로 시작하기
            </button>
          </div>
        </>
      )}
    </div>
  )
}
