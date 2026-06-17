// src/services/socket.js
// Socket.io singleton — import and call connect() once in AppShell

import { io } from 'socket.io-client'
import { WS_URL } from '@/config'

let socket = null

export function connect() {
  if (socket?.connected) return socket

  socket = io(WS_URL, {
    auth: { token: localStorage.getItem('cidss_token') },
    transports: ['websocket'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  })

  socket.on('connect', () => console.log('[WS] connected'))
  socket.on('disconnect', (reason) => console.warn('[WS] disconnected', reason))

  return socket
}

export function getSocket() {
  return socket
}

export function disconnect() {
  socket?.disconnect()
  socket = null
}
