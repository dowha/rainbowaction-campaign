// pages/index.tsx
import React, { useState } from 'react'
import Uploader from '@/components/Uploader'
import CanvasPreview from '@/components/CanvasPreview'
import MessageForm from '@/components/MessageForm'
import MessageList from '@/components/MessageList'

type OverlayPosition = 'top-left' | 'top-right' | 'bottom-right'

export default function Home() {
  const [view, setView] = useState<'upload' | 'message'>('upload')
  const [image, setImage] = useState<File | null>(null)
  const [overlayFile, setOverlayFile] = useState('rainbow-flag.png')
  const [overlayEmoji, setOverlayEmoji] = useState('🌈')
  const [overlayPosition, setOverlayPosition] =
    useState<OverlayPosition>('top-right')

  return (
    <div className="min-h-screen flex flex-col text-sm bg-gray-50">
      <header className="w-full py-4 border-b text-center font-semibold text-lg bg-white shadow-sm z-10">
        🖼️ 프로필 이미지 캠페인
      </header>

      <main className="flex-1 flex justify-center px-4 py-6">
        {view === 'upload' ? (
          <div className="w-full max-w-md">
            <h1 className="text-lg font-semibold leading-6 text-center mb-4">
              🌈 캠페인 참여하기
            </h1>
            <Uploader onSelect={setImage} />
            <div className="flex justify-center gap-3 my-4">
              {[
                { emoji: '🌈', file: 'rainbow-flag.png' },
                { emoji: '⭐', file: 'star.png' },
                { emoji: '❤️', file: 'heart.png' },
                { emoji: '💪', file: 'support.png' },
              ].map((item) => (
                <button
                  key={item.file}
                  onClick={() => {
                    setOverlayFile(item.file)
                    setOverlayEmoji(item.emoji)
                  }}
                  className={`w-10 h-10 rounded-full border text-xl flex items-center justify-center transition ${
                    overlayFile === item.file
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-white border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>

            {image && (
              <CanvasPreview
                image={image}
                overlay={overlayFile}
                position={overlayPosition}
                setPosition={setOverlayPosition}
              />
            )}

            <div className="text-center mt-6">
              <button
                className="text-sm text-blue-600 underline"
                onClick={() => setView('message')}
              >
                ✍ 메시지 남기러 가기
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl">
            <div className="w-full max-w-md mx-auto mb-8">
              <h2 className="text-lg font-semibold leading-6 mb-4 text-center">
                ✍ 응원 메시지 남기기
              </h2>
              <MessageForm
                overlay={overlayEmoji}
                onComplete={() => setView('message')}
              />
            </div>

            <div className="w-full">
              <h2 className="text-lg font-semibold leading-6 mb-4 text-center">
                💌 남겨진 응원 메시지
              </h2>
              <MessageList />
              <div className="text-center mt-6">
                <button
                  className="text-sm text-gray-500 underline"
                  onClick={() => setView('upload')}
                >
                  🎨 프로필 다시 만들기
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full py-4 text-center text-xs text-gray-400 border-t bg-white">
        <p className="py-1">후원계좌: 국민은행 408801-01-317159 성소수자차별반대 무지개행동</p>
        <p className="text-black">
          © {new Date().getFullYear()} 성소수자차별반대 무지개행동. All rights reserved.
        </p>
        <p>With ❤️ by Dowha</p>
      </footer>
    </div>
  )
}
