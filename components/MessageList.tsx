'use client'
import { useEffect, useState } from 'react'

type Message = {
  nickname: string
  message: string
  overlay?: string
  timestamp: string
}

const emojiBgMap: Record<string, string> = {
  '🌈': 'bg-pink-100',
  '⭐': 'bg-yellow-100',
  '❤️': 'bg-red-100',
  '💪': 'bg-green-100',
}

export default function MessageList() {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // TODO: Supabase에서 메시지 가져오기
        const dummy: Message[] = [
          {
            nickname: '익명',
            message: '힘내세요! ❤️',
            overlay: '❤️',
            timestamp: new Date().toISOString(),
          },
        ]
        setMessages(dummy)
      } catch (err) {
        console.error('메시지 불러오기 실패:', err)
      }
    }

    fetchMessages()
  }, [])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-4">
        {messages.map((item, idx) => (
          <div
            key={idx}
            className="bg-[linear-gradient(135deg,rgba(255,0,0,0.06),rgba(255,165,0,0.06),rgba(255,255,0,0.06),rgba(0,128,0,0.06),rgba(0,0,255,0.06),rgba(75,0,130,0.06))] p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between h-full gap-3
            transition-all duration-200 transform hover:scale-[1.015)]"
          >
            <div className="flex items-start gap-3">
              {item.overlay && (
                <div
                  className={`text-xl w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full ${
                    emojiBgMap[item.overlay] || 'bg-gray-100'
                  }`}
                >
                  {item.overlay}
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.nickname}</p>
                <p className="text-gray-700 whitespace-pre-line">
                  {item.message}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-right mt-2">
              {new Date(item.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
