// components/ProfileBuilder.tsx
import Uploader from '@/components/Uploader'
import CanvasPreview from '@/components/CanvasPreview'
import React from 'react'
import NextImage from 'next/image'

export default function ProfileBuilder({
  image,
  setImage,
  overlayFile,
  setOverlayFile,
}: {
  image: File | null
  setImage: (file: File) => void
  overlayFile: string
  setOverlayFile: (file: string) => void
}) {
  const labels = [
    '무지개 머리띠',
    '동지 머리띠',
    '투쟁 머리띠',
    '평등 머리띠',
    '무지개 손깃발',
    '트랜스 손깃발',
    '수호동지 버튼',
    '무지개 반짝이',
    '민주주의 지키는\n성소수자',
    '성소수자 지키는\n민주주의',
  ]

  return (
    <div className="w-full pt-2 pb-16">
      <Uploader
        onSelect={(file) => {
          setImage(file)
          setOverlayFile('asset01.png')
        }}
      />

      {image && (
        <div className="overflow-x-auto px-4 py-2 -mx-4">
          <div className="flex gap-x-3 pl-[1px] pr-4 scrollbar-hide h-28">
            {labels.map((label, i) => {
              const asset = `asset${String(i + 1).padStart(2, '0')}.png`
              const selected = overlayFile === asset
              return (
                <button
                  key={asset}
                  onClick={() => setOverlayFile(asset)}
                  className={`flex-shrink-0 w-24 h-full rounded-xl border text-xs font-medium p-1 flex flex-col items-center justify-center text-center transition ${
                    selected
                      ? 'bg-blue-50 border-2 border-blue-500 text-blue-700 shadow-sm'
                      : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <NextImage
                    src={`/${asset}`}
                    alt={label}
                    width={48}
                    height={48}
                    className="mb-2 object-contain"
                  />

                  <span className="whitespace-pre-line leading-tight min-h-[2.75rem] flex items-center justify-center">
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {image && <CanvasPreview image={image} overlay={overlayFile} />}

      <div className="mt-6 bg-yellow-50 text-yellow-800 text-sm rounded-xl px-4 py-3">
        🔒 업로드된 이미지는 인터넷이나 서버에 저장되지 않으며, 오직 사용자의
        브라우저 내에서만 안전하게 처리됩니다. 제3자에게 전송되지 않으니
        안심하고 사용하셔도 됩니다.
      </div>
    </div>
  )
}
