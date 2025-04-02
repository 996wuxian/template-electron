import { defineStore } from 'pinia'
import { io, Socket } from 'socket.io-client'
import { ref } from 'vue'

const useSocketStore = defineStore('socket', () => {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)

  // 初始化 socket 连接
  const initSocket = () => {
    if (!socket.value) {
      socket.value = io('http://localhost:3000', {
        transports: ['websocket'],
        autoConnect: true
      })

      // 连接成功
      socket.value.on('connect', () => {
        isConnected.value = true
        console.log('Socket connected')
      })

      // 连接断开
      socket.value.on('disconnect', () => {
        isConnected.value = false
        console.log('Socket disconnected')
      })

      // 连接错误
      socket.value.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        isConnected.value = false
      })
    }
  }

  // 断开连接
  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  // 发送消息
  const emit = (event: string, data: any) => {
    if (socket.value && isConnected.value) {
      socket.value.emit(event, data)
    }
  }

  // 监听事件
  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socket.value) {
      socket.value.on(event, callback)
    }
  }

  // 移除事件监听
  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socket.value) {
      socket.value.off(event, callback)
    }
  }

  return {
    socket,
    isConnected,
    initSocket,
    disconnect,
    emit,
    on,
    off
  }
})

export default useSocketStore
