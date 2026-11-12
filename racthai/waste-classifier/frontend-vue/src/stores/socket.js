/**
 * socket.js - Socket.io store
 * Quan ly ket noi realtime toan app
 */
import { reactive, ref } from 'vue'
import { io } from 'socket.io-client'

const state = reactive({
  connected:    false,
  socket:       null,
  currentChatId: null,
  messages:     [],       // tin nhan hien tai
  onlineStaff:  0,
  unreadCount:  0,
})

let _socket = null

export function useSocket() {

  function connect(token = null) {
    if (_socket?.connected) return _socket

    // Luôn kết nối thẳng đến Express+Socket.io server (port 5000)
    // Không đi qua Vite proxy vì WebSocket cần direct connection
    let socketUrl
    if (import.meta.env.VITE_API_URL) {
      socketUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '')
    } else if (window.location.port === '5173') {
      // Dev: kết nối thẳng port 5000
      socketUrl = `${window.location.protocol}//${window.location.hostname}:5000`
    } else {
      // Production/ngrok: cùng origin
      socketUrl = window.location.origin
    }

    _socket = io(socketUrl, {
      auth:              { token },
      transports:        ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })

    state.socket = _socket

    _socket.on('connect', () => {
      state.connected = true
      console.log('[Socket] Connected:', _socket.id)
    })

    _socket.on('disconnect', () => {
      state.connected = false
      console.log('[Socket] Disconnected')
    })

    _socket.on('staff_online_count', (count) => {
      state.onlineStaff = count
    })

    return _socket
  }

  function disconnect() {
    if (_socket) {
      _socket.disconnect()
      _socket = null
      state.socket = null
      state.connected = false
    }
  }

  function getSocket() { return _socket }

  function emit(event, data) {
    if (_socket?.connected) _socket.emit(event, data)
  }

  function on(event, cb) {
    if (_socket) _socket.on(event, cb)
  }

  function off(event, cb) {
    if (_socket) _socket.off(event, cb)
  }

  return { state, connect, disconnect, getSocket, emit, on, off }
}
