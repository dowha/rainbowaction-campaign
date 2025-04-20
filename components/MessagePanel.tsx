import MessageForm from '@/components/MessageForm'
import MessageList from '@/components/MessageList'
import React from 'react'

export default function MessagePanel({
  overlayFile,
  setView,
}: {
  overlayFile: string
  setView: (v: 'upload' | 'message') => void
}) {
  return (
    <div className="w-full pt-2 pb-16">
      <div className="max-w-md mx-auto mb-8">
        <MessageForm
          overlay={overlayFile}
          onComplete={() => setView('message')}
        />
      </div>

      <div className="w-full">
        <h2 className="text-lg font-semibold leading-6 mb-4 text-center">
          💌 남겨진 응원 메시지
        </h2>
        <MessageList />
      </div>
    </div>
  )
}
