'use client'

import React, { useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Step1_UploadAndSelect from '@/components/ProfileSteps/Step1_UploadAndSelect'
import Step2_PreviewAndDownload from '@/components/ProfileSteps/Step2_PreviewAndDownload'

export default function Home() {
  const [step, setStep] = useState<1 | 2>(1)
  const [image, setImage] = useState<File | null>(null)
  const [overlayFile, setOverlayFile] = useState('asset01.png')

  return (
    <>
      <Head>
        <title>무지개수호대 프로필 꾸미기</title>
        <meta
          name="description"
          content="나만의 무지개수호대 프로필 이미지를 만들어보세요!"
        />
        <meta property="og:title" content="무지개수호대 프로필 꾸미기" />
        <meta
          property="og:description"
          content="성소수자차별반대 무지개행동의 무지개 프로필 캠페인에 참여해보세요."
        />
        <meta
          property="og:image"
          content="https://profile.rainbowaction.kr/og-image.png"
        />
        <meta property="og:url" content="https://profile.rainbowaction.kr/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="무지개수호대 프로필 꾸미기" />
        <meta
          name="twitter:description"
          content="나만의 무지개수호대 프로필 이미지를 만들어보세요!"
        />
        <meta
          name="twitter:image"
          content="https://profile.rainbowaction.kr/og-image-twitter.png"
        />
      </Head>

      <div className="min-h-screen bg-gray-100 text-sm">
        {/* 고정 헤더 */}
        <header className="fixed top-0 w-full z-50 bg-gray-100">
          <div className="max-w-[420px] mx-auto bg-white border-b py-5 relative h-20">
            <Image
              src="/logo.png"
              alt="로고"
              fill
              className="object-contain cursor-pointer"
              onClick={() => {
                setImage(null)
                setOverlayFile('asset01.png')
                setStep(1)
              }}
            />
          </div>
        </header>

        {/* 본문 */}
        <main className="w-full max-w-[420px] mx-auto px-4 pt-[120px] pb-[80px] bg-white min-h-screen">
          {step === 1 || !image ? (
            <Step1_UploadAndSelect
              image={image}
              setImage={setImage}
              overlayFile={overlayFile}
              setOverlayFile={setOverlayFile}
              onNext={() => setStep(2)}
            />
          ) : (
            <Step2_PreviewAndDownload
              image={image!}
              overlayFile={overlayFile}
              setOverlayFile={setOverlayFile}
            />
          )}
        </main>

        {/* 고정 푸터 */}
        <footer className="w-full z-40 bg-gray-100">
          <div className="max-w-[420px] mx-auto bg-white text-center py-4 px-4 border-t text-xs text-gray-400">
            <p className="py-1">
              후원계좌: 국민은행 408801-01-317159 성소수자차별반대 무지개행동
            </p>
            <p className="text-black">
              © {new Date().getFullYear()} 성소수자차별반대 무지개행동. All
              rights reserved.
            </p>
            <p>With ❤️ by Dowha</p>
          </div>
        </footer>
      </div>
    </>
  )
}
