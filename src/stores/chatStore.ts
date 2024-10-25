import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getChats, getMessages, sendMessage, getRoomMessages, socket } from '../api'
import { useAuthStore } from './authStore'
import { useNotificationStore } from './notificationStore'
import { useRouter } from 'vue-router'

export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()
  const router = useRouter()

  const messages = ref([])
  const currentRoom = ref(null)
  const directChats = ref({})
  const acceptedConversations = ref(new Set())

  const joinRoom = async (roomId: string) => {
    currentRoom.value = roomId
    socket.emit('join', roomId)
    const response = await getRoomMessages(roomId)
    messages.value = response.data
  }

  const sendMessageToUser = async (text: string, receiverId: string) => {
    const senderId = authStore.user.id
    const response = await sendMessage(senderId, receiverId, null, text)
    messages.value.push(response.data)
    socket.emit('send_message', response.data)
debugger
    // Create notification independently of socket connection
    await notificationStore.addNotification({
      userId: receiverId,
      type: 'message',
      content: `New message from ${authStore.user.name}`,
      link: `/chat/user/${senderId}`
    })

    return response.data
  }

  const sendMessageToRoom = async (text: string, roomId: string) => {
    const senderId = authStore.user.id
    const response = await sendMessage(senderId, null, roomId, text)
    messages.value.push(response.data)
    socket.emit('send_message', response.data)

    // Create notification for all room members except sender
    if (currentRoom.value) {
      const roomMembers = currentRoom.value.users.filter(user => user.id !== senderId)
      for (const member of roomMembers) {
        await notificationStore.addNotification({
          userId: member.id,
          type: 'message',
          content: `New message in ${currentRoom.value.name} from ${authStore.user.name}`,
          link: `/chat/room/${roomId}`
        })
      }
    }

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
    messages.value = response.data
    return response.data
  }

  const acceptConversation = (roomId: string) => {
    acceptedConversations.value.add(roomId)
  }

  const isConversationAccepted = (roomId: string) => {
    return acceptedConversations.value.has(roomId)
  }

  // Listen for incoming messages - only for real-time updates
  socket.on('new_message', (message) => {
    if ((currentRoom.value && message.roomId === currentRoom.value) ||
        (!currentRoom.value && (message.senderId == authStore.user?.id || message.receiverId == authStore.user?.id))) {
      messages.value.push(message)
    }
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