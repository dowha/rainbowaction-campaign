import React, { useState } from 'react'
import Image from 'next/image'
import ProfileBuilder from '@/components/ProfileBuilder'
import MessagePanel from '@/components/MessagePanel'

export default function Home() {
  const [view, setView] = useState<'upload' | 'message'>('upload')
  const [image, setImage] = useState<File | null>(null)
  const [overlayFile, setOverlayFile] = useState('asset01.png')

  return (
    <div className="min-h-screen bg-gray-100 text-sm">
      {/* 고정 헤더 */}
      <header className="fixed top-0 w-full z-50 bg-gray-100">
        <div className="max-w-[420px] mx-auto bg-white border-b py-5 relative h-20">
          <Image src="/logo.png" alt="로고" fill className="object-contain" />
        </div>
      </header>

      {/* 고정 GNB */}
      <div className="fixed top-[76px] w-full z-40 bg-gray-100">
        <div className="mx-auto max-w-[420px] bg-white flex overflow-hidden border-y">
          <div
            onClick={() => setView('upload')}
            className={`w-1/2 text-center py-3 text-base font-medium cursor-pointer transition ${
              view === 'upload'
                ? 'text-blue-700 border-b-2 border-blue-500 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🎨 프로필 꾸미기
          </div>
          <div
            onClick={() => setView('message')}
            className={`w-1/2 text-center py-3 text-base font-medium cursor-pointer transition ${
              view === 'message'
                ? 'text-blue-700 border-b-2 border-blue-500 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ✍ 메시지 남기기
          </div>
        </div>
      </div>

      {/* 본문 */}
      <main className="w-full max-w-[420px] mx-auto px-4 pt-[150px] pb-[80px] overflow-y-auto bg-white min-h-screen">
        {view === 'upload' ? (
          <ProfileBuilder
            image={image}
            setImage={setImage}
            overlayFile={overlayFile}
            setOverlayFile={setOverlayFile}
          />
        ) : (
          <MessagePanel overlayFile={overlayFile} setView={setView} />
        )}
      </main>

      {/* 고정 푸터 */}
      <footer className="fixed bottom-0 w-full z-40 bg-gray-100">
        <div className="max-w-[420px] mx-auto bg-white text-center py-4 px-4 border-t text-xs text-gray-400">
          <p className="py-1">
            후원계좌: 국민은행 408801-01-317159 성소수자차별반대 무지개행동
          </p>
          <p className="text-black">
            © {new Date().getFullYear()} 성소수자차별반대 무지개행동. All rights
            reserved.
          </p>
          <p>With ❤️ by Dowha</p>
        </div>
      </footer>
    </div>
  )
}
