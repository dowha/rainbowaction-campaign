'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Message = {
  id: string
  nickname: string
  message: string
  created_at: string
}

export default function MessageList({
  refreshTrigger = 0,
}: {
  refreshTrigger?: number
}) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('status', 'public')
          .order('created_at', { ascending: false })

        if (error) throw error
        setMessages(data ?? [])
      } catch (err) {
        console.error('메시지 불러오기 실패:', err)
      }
    }

    fetchMessages()
  }, [refreshTrigger]) // ✅ 상태 변화 감지

  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-4">
        아직 등록된 메시지가 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((item) => (
        <div
          key={item.id}
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
        >
          <div className="font-medium text-gray-800">{item.nickname}</div>
          <p className="text-gray-700 whitespace-pre-line mt-1">
            {item.message}
          </p>
          <div className="text-right text-xs text-gray-400 mt-2">
            {new Date(item.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}
