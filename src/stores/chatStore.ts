import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getChats, getMessages, sendMessage, getRoomMessages, socket } from '../api'
import { useAuthStore } from './authStore'

export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore()

  const messages = ref([])
  const currentRoom = ref(null)
  const directChats = ref({})
  const acceptedConversations = ref(new Set())

  const joinRoom = async (roomId: string) => {currentRoom.value = roomId
    socket.emit('join', roomId)
    const response = await getRoomMessages(roomId)
    messages.value = response.data
  }

  const sendMessageToUser = async (text: string, receiverId: string) => {

    const senderId = authStore.user.id // This should be the current user's ID
    const response = await sendMessage(senderId, receiverId, null, text)
    messages.value.push(response.data)
    socket.emit('send_message', response.data)
    return response.data
  }

  const sendMessageToRoom = async (text: string, roomId: string) => {

    const senderId = authStore.user.id // This should be the current user's ID
    const response = await sendMessage(senderId, null, roomId, text)
    messages.value.push(response.data)
    socket.emit('send_message', response.data)
    return response.data
  }

  const fetchUserChats = async (userId: string) => {
    const response = await getChats(userId)
    return response.data
  }

  const fetchMessages = async (userId1: string, userId2: string, page: number = 1, limit: number = 10) => {
    const response = await getMessages(userId1, userId2, page, limit)
    return response.data
  }

  const fetchRoomMessages = async (roomId: string, page: number = 1, limit: number = 10) => {
    const response = await getRoomMessages(roomId, page, limit)
    return response.data
  }

  const acceptConversation = (roomId: string) => {
    acceptedConversations.value.add(roomId)
  }

  const isConversationAccepted = (roomId: string) => {
    return acceptedConversations.value.has(roomId)
  }

  // Listen for incoming messages
  socket.on('new_message', (message) => {
    messages.value.push(message)
  })

  return { 
    messages, 
    currentRoom, 
    directChats, 
    joinRoom, 
    sendMessageToUser,
    sendMessageToRoom,
    fetchUserChats, 
    fetchMessages,
    fetchRoomMessages,
    acceptConversation,
    isConversationAccepted
  }
})
