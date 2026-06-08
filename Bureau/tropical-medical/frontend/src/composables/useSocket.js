import { io } from 'socket.io-client'
import { ref } from 'vue'

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')

let _socket = null
export const socketConnecte = ref(false)

export function useSocket() {
  function connecter(token, userId, role) {
    if (_socket?.connected) return _socket

    _socket = io(SOCKET_URL, {
      query:      { userId: String(userId), role },
      auth:       { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
    })

    _socket.on('connect',    () => { socketConnecte.value = true  })
    _socket.on('disconnect', () => { socketConnecte.value = false })

    return _socket
  }

  function deconnecter() {
    _socket?.disconnect()
    _socket = null
    socketConnecte.value = false
  }

  function getSocket() { return _socket }

  return { connecter, deconnecter, getSocket, socketConnecte }
}
