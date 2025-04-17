'use client'
import { useState } from 'react'

type Props = {
  overlay: string
  onComplete?: () => void
}

export default function MessageForm({ overlay, onComplete }: Props) {
  const [nickname, setNickname] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // TODO: Supabase 연동으로 교체
      const payload = {
        nickname,
        message,
        overlay,
        timestamp: new Date().toISOString(),
      }

      console.log('📦 Supabase로 보낼 데이터:', payload)
      setSubmitted(true)
      setTimeout(() => {
        onComplete?.()
      }, 1000)
    } catch (err) {
      console.error('제출 중 오류:', err)
      alert('오류가 발생했습니다.')
    }
  }

  return (
    <div className="mt-4">
      {submitted ? (
        <p className="text-center">응원 메시지가 제출되었습니다! 💌</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border rounded shadow-sm text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">지지 메시지</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={300}
              rows={4}
              className="w-full mt-1 px-3 py-2 border rounded shadow-sm text-sm"
            />
            <p className="text-xs text-right text-gray-400 mt-1">
              {message.length} / 300자
            </p>
          </div>
          <button
            type="submit"
            className="w-full bg-[#415E9A] text-white py-2 rounded hover:bg-blue-500 transition"
          >
            제출
          </button>
        </form>
      )}
    </div>
  )
}
