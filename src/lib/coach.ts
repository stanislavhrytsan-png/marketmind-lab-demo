/**
 * The scripted conversation with the coach. No model is called: every line
 * is fixed text from the data files.
 */
import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../data/alpineOat'

/** A scripted conversation with the coach: how it opens, the replies a click inserts, and the hints. */
export interface CoachLines {
  opening: ChatMessage[]
  turns: { student: string; coach: string }[]
  hints?: string[]
}

/**
 * Plays a scripted conversation. The coach "answers" after a short pause with
 * the next line of the script. Used by the tutor panel and by the short
 * exchanges on the screens of the further modules.
 */
export function useCoachScript(script: CoachLines, onNewMessage?: () => void) {
  const [messages, setMessages] = useState<ChatMessage[]>(script.opening)
  const [turn, setTurn] = useState(0)
  const [hints, setHints] = useState(0)
  const [reply, setReply] = useState('')
  const [thinking, setThinking] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Bring a new message into view. The opening conversation does not move the panel.
  const seen = useRef(messages.length)
  useEffect(() => {
    if (messages.length > seen.current || thinking) onNewMessage?.()
    seen.current = messages.length
  }, [messages, thinking, onNewMessage])

  const next = script.turns[turn] as { student: string; coach: string } | undefined
  const hintLimit = script.hints?.length ?? 0

  const coachSays = (message: ChatMessage, after?: () => void) => {
    setThinking(true)
    timer.current = window.setTimeout(() => {
      setMessages((old) => [...old, message])
      setThinking(false)
      after?.()
    }, 900)
  }

  return {
    messages,
    thinking,
    reply,
    hints,
    hintLimit,
    next,
    scriptDone: !next,
    /** A click on the reply field inserts the student's next scripted answer. */
    insertReply: () => {
      if (!reply && next) setReply(next.student)
    },
    send: () => {
      if (!reply || thinking || !next) return
      setMessages((old) => [...old, { from: 'student', text: reply }])
      setReply('')
      coachSays({ from: 'coach', text: next.coach }, () => setTurn((t) => t + 1))
    },
    askHint: () => {
      if (hints >= hintLimit || thinking || !script.hints) return
      const n = hints + 1
      setHints(n)
      coachSays({ from: 'coach', text: script.hints[n - 1], hint: n })
    },
  }
}
