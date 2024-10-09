import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getChats, getMessages, sendMessage, socket } from '../api'

export const useChatStore = defineStore('chat', () => {
  const messages = ref([])
  const currentRoom = ref(null)
  const directChats = ref({})
  const acceptedConversations = ref(new Set())

  const joinRoom = async (roomId: string) => {
    currentRoom.value = roomId
    socket.emit('join', roomId)
    const response = await getMessages(roomId, roomId)
    messages.value = response.data
  }

  const sendMessageToUser = async (text: string, receiverId: string) => {
    const senderId = '1' // This should be the current user's ID
    const response = await sendMessage(senderId, receiverId, text)
    messages.value.push(response.data)
    socket.emit('chat message', response.data)
    return response.data
  }

  const fetchUserChats = async (userId: string) => {
    const response = await getChats(userId)
    return response.data
  }

  const fetchMessages = async (userId1: string, userId2: string) => {
    const response = await getMessages(userId1, userId2)
    return response.data
  }

  const acceptConversation = (roomId: string) => {
    acceptedConversations.value.add(roomId)
  }

  const isConversationAccepted = (roomId: string) => {
    return acceptedConversations.value.has(roomId)
  }

  // Listen for incoming messages
  socket.on('chat message', (message) => {
    messages.value.push(message)
  })

  return { 
    messages, 
    currentRoom, 
    directChats, 
    joinRoom, 
    sendMessageToUser, 
    fetchUserChats, 
    fetchMessages,
    acceptConversation,
    isConversationAccepted
  }
})