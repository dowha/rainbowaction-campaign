'use client'
import MessageForm from '@/components/MessageForm'
import MessageList from '@/components/MessageList'
import React, { useState } from 'react'

export default function MessagePanel({
  setView,
}: {
  overlayFile: string
  setView: (v: 'upload' | 'message') => void
}) {
  const [refreshCount, setRefreshCount] = useState(0)

  return (
    <div className="w-full pt-2 pb-16">
      <div className="max-w-md mx-auto mb-8">
        <MessageForm
          onComplete={() => {
            setRefreshCount((c) => c + 1) // ✅ 메시지 새로고침
            setView('message')
          }}
        />
      </div>

      <div className="w-full">
        <h2 className="text-lg font-semibold leading-6 mb-4 text-center">
          💌 남겨진 응원 메시지
        </h2>
        <MessageList refreshTrigger={refreshCount} /> {/* ✅ 상태 전달 */}
      </div>
    </div>
  )
}
