'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function MessageForm({
  onComplete,
}: {
  onComplete?: () => void
}) {
  const [nickname, setNickname] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from('messages').insert({
        nickname,
        message,
      })

      if (error) throw error

      setSubmitted(true)
      setTimeout(() => {
        onComplete?.() // ✅ 여기서 상위 컴포넌트로 알려줌
      }, 500)
    } catch (err) {
      console.error('제출 중 오류:', err)
      alert('메시지 제출 중 오류가 발생했습니다.')
    }
  }

  if (submitted) {
    return (
      <div className="text-center text-green-600 text-sm py-4">
        💌 메시지가 성공적으로 등록되었어요!
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          닉네임 (또는 익명)
        </label>
        <input
          type="text"
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full border px-3 py-2 rounded text-sm"
          placeholder="예: 익명의 지지자"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          메시지
        </label>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full border px-3 py-2 rounded text-sm"
          placeholder="힘이 되는 메시지를 남겨주세요!"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700"
      >
        ✍ 메시지 남기기
      </button>
    </form>
  )
}
