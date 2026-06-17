// src/hooks/useSocket.js
// Subscribe to a specific WebSocket event; auto-unsubscribes on unmount

import { useEffect } from 'react'
import { getSocket } from '@/services/socket'

export function useSocket(event, handler) {
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    socket.on(event, handler)
    return () => socket.off(event, handler)
  }, [event, handler])
}
