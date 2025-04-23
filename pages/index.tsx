'use client'

import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Step1_UploadAndSelect from '@/components/ProfileSteps/Step1_UploadAndSelect'
import Step2_PreviewAndDownload from '@/components/ProfileSteps/Step2_PreviewAndDownload'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [image, setImage] = useState<File | null>(null)
  const [overlayFile, setOverlayFile] = useState('asset01.png')
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('anonymous_id')) {
      localStorage.setItem('anonymous_id', crypto.randomUUID())
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' }) // 'instant'는 일부 브라우저에서 무시될 수 있음
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }, 100)

    return () => clearTimeout(timeout)
  }, [step])

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    const inAppPatterns = [
      'instagram',
      'fbav',
      'fb_iab',
      'fban',
      'twitter',
      'tiktok',
      'pinterest',
      'reddit',
      'linkedin',
      'telegram',
      'telegrambot',
      'slack',
      'line',
      'kakaotalk',
      'wechat',
      'whatsapp',
      'messenger',
      'naver',
      'daum',
      'youtube',
      'snapchat',
      'discord',
    ]
    const isInApp = inAppPatterns.some((pattern) => ua.includes(pattern))
    setIsInAppBrowser(isInApp)
  }, [])

  return (
    <>
      <Head>
        {/* ... (Head content remains the same) ... */}
        <title>수호동지 프로필 꾸미기</title>
        <meta
          name="description"
          content="프로필 사진에 무지개 아이템을 추가해 성소수자에 대한 지지를 표현해주세요."
        />
        <meta property="og:title" content="수호동지 프로필 꾸미기" />
        <meta
          property="og:description"
          content="프로필 사진에 무지개 아이템을 추가해 성소수자에 대한 지지를 표현해주세요."
        />
        <meta
          property="og:image"
          content="https://profile.rainbowaction.kr/og-image.png"
        />
        <meta property="og:url" content="https://profile.rainbowaction.kr/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="수호동지 프로필 꾸미기" />
        <meta
          name="twitter:description"
          content="프로필 사진에 무지개 아이템을 추가해 성소수자에 대한 지지를 표현해주세요."
        />
        <meta
          name="twitter:image"
          content="https://profile.rainbowaction.kr/og-image-twitter.png"
        />
      </Head>

      {/* Outermost container: sets flex column, min height, and background */}
      <div
        className="flex flex-col min-h-screen bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: "url('/bg.png')", minHeight: '100dvh' }}
      >
        {/* Fixed Header */}
        <header className="sticky top-0 z-50 w-full">
          <div className="max-w-[420px] mx-auto h-20 relative py-5 bg-white">
            <Image
              src="/logo.png"
              alt="로고"
              fill
              className="object-contain cursor-pointer"
              onClick={() => {
                setImage(null)
                setOverlayFile('asset01.png')
                setStep(0)
              }}
            />
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 min-h-0 w-full max-w-[420px] mx-auto bg-white flex flex-col border-t border-[#E1A8BD]">
          <div className="w-full px-4 pt-4 pb-6 flex-grow">
            <div
              key={step}
              className="transition-opacity duration-300 ease-in-out animate-fade"
            >
              {step === 0 ? (
                <div className="text-center space-y-6">
                  {isInAppBrowser && (
                    <p className="text-xs text-red-800 px-4 py-3 border border-red-300 bg-red-50 rounded-3xl animate-pulse">
                      ⚠️ 텔레그램, 인스타그램, 페이스북 등 일부 앱의 내부
                      브라우저에서는 이미지가 정상적으로 다운로드되지 않을 수
                      있습니다.{' '}
                      <a
                        href={
                          typeof window !== 'undefined'
                            ? window.location.href
                            : '/'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-600 font-medium"
                      >
                        외부 브라우저
                      </a>
                      (크롬, 사파리 등)에서 다시 접속해 주세요.
                    </p>
                  )}
                  <div className="bg-white border border-[#84C0D3] rounded-2xl px-6 py-8">
                    <h1 className="text-xl font-bold text-[#415E9A] mb-2 ">
                      수호동지 프로필 꾸미기!
                    </h1>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      프로필 사진에 무지개 아이템을 추가해
                      <br />
                      성소수자에 대한 지지를 표현해주세요!
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          await supabase.from('image_creations').insert({
                            stage: 'started',
                            anonymous_id: localStorage.getItem('anonymous_id'),
                            user_agent: navigator.userAgent,
                            referrer: document.referrer || null,
                          })
                        } catch (err) {
                          console.error('Supabase 기록 실패:', err)
                        } finally {
                          setStep(1)
                        }
                      }}
                      className="mt-6 px-5 py-2 text-white text-sm bg-[#415E9A] hover:bg-[#84C0D3] transition"
                    >
                      <strong>시작하기</strong>
                    </button>
                  </div>

                  <p className="text-xs text-green-800 px-4 py-3 border border-green-300 bg-green-50 rounded-2xl">
                    🔒 이미지는 브라우저에서만 처리되며, 서버에 저장되지
                    않습니다.
                  </p>
                </div>
              ) : step === 1 || !image ? (
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
                  onReset={() => {
                    setImage(null)
                    setOverlayFile('asset01.png')
                    setStep(1)
                  }}
                />
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full mt-auto">
          <div className="max-w-[420px] mx-auto text-center text-sm text-gray-400 bg-white py-3">
            <div className="w-full bg-[#F1F5FF] text-[#415E9A] leading-tight text-center py-4 px-4 border-y border-[#84C0D3] font-medium tracking-tight">
              전체 캠페인 정보는{' '}
              <a
                href="https://rainbowaction.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                무지개 수호대 페이지
              </a>
              에서 확인하실 수 있어요.
            </div>
            {/* Existing Footer Info */}
            <p className="pt-4 pb-1 text-black">
              <span className="text-[#2A559B]">
                <strong>후원계좌</strong>
              </span>
              <br />
              <a
                href="https://aq.gy/f/2K1E%5E"
                target="_blank"
                rel="noopener noreferrer"
              >
                국민은행 408801-01-317159 성소수자차별반대 무지개행동
              </a>
            </p>
            <p className="pb-1 text-sm text-black">
              © {new Date().getFullYear()} 성소수자차별반대{' '}
              <a
                href="mailto:contact@rainbowaction.kr"
                className="text-black no-underline"
              >
                무지개행동
              </a>
              .
            </p>
            <p className="text-[#E1A8BD] text-xs pb-4">
              Made with ♥ by{' '}
              <a
                href="https://dowha.kim"
                className="text-[#E1A8BD] no-underline"
                target="_blank"
              >
                Dowha
              </a>
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
