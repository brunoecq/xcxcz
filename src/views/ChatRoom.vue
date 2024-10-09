<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-for="message in currentMessages" :key="message.id" class="flex" :class="{ 'justify-end': message.senderId === currentUser.id }">
        <div :class="['max-w-xs lg:max-w-md px-4 py-2 rounded-lg', message.senderId === currentUser.id ? 'bg-blue-500 text-white' : 'bg-white']">
          <p class="font-semibold">{{ getUserName(message.senderId) }}</p>
          <p>
            <span v-for="(word, index) in message.text.split(' ')" :key="index" class="relative group">
              {{ word }}
              <span class="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2">
                <button @click="copyWord(word)">Copy</button>
                <button @click="translateWord(word)">Translate</button>
              </span>
            </span>
          </p>
          <p class="text-xs opacity-75">{{ formatTime(message.createdAt, getUserTimezone(message.senderId)) }}</p>
        </div>
      </div>
    </div>
    <div class="bg-white p-4">
      <form @submit.prevent="sendMessage" class="flex space-x-2">
        <input v-model="newMessage" type="text" placeholder="Type a message..." class="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        <button type="button" @click="toggleEmojiPicker" class="px-4 py-2 bg-gray-200 rounded-md">😊</button>
        <button type="submit" :disabled="!canSendMessage" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" :class="{ 'opacity-50 cursor-not-allowed': !canSendMessage }">Send</button>
      </form>
      <div v-if="showEmojiPicker" class="mt-2">
        <!-- Aquí iría el componente del selector de emojis --></div>
    </div>
    <div v-if="needsAcceptance" class="bg-yellow-100 p-4 text-center">
      <p>The other user needs to accept to continue the conversation.</p>
      <button v-if="currentUser.id !== otherUserId" @click="acceptConversation" class="mt-2 bg-green-500 text-white px-4 py-2 rounded-md">Accept Conversation</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '../stores/chatStore'
import { useUserStore } from '../stores/userStore'
import { useAuthStore } from '../stores/authStore'
import { useNotificationStore } from '../stores/notificationStore'
import { socket } from '../api'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const userStore = useUserStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const roomId = computed(() => route.params.roomId as string)
const currentMessages = ref([])
const newMessage = ref('')
const currentUser = computed(() => authStore.user)
const showEmojiPicker = ref(false)
const messageCount = ref(0)
const needsAcceptance = ref(false)
const otherUserId = ref(null)

const canSendMessage = computed(() => {
  return authStore.isAuthenticated && 
         (!needsAcceptance.value || messageCount.value < 3 || currentUser.value.id === otherUserId.value)
})

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  await loadMessages()
  await userStore.fetchUsers()
  otherUserId.value = route.params.userId
  messageCount.value = currentMessages.value.filter(m => m.senderId === currentUser.value.id).length
  needsAcceptance.value = messageCount.value >= 3 && !chatStore.isConversationAccepted(roomId.value)

  socket.emit('join', roomId.value)

  socket.on('chat message', (message) => {
    currentMessages.value.push(message)
  })
})

watch(() => route.params.roomId, async (newRoomId) => {
  if (newRoomId && newRoomId !== roomId.value) {
    await loadMessages()
  }
})

const loadMessages = async () => {
  currentMessages.value = await chatStore.fetchMessages(currentUser.value.id.toString(), otherUserId.value)
}

const sendMessage = async () => {
  if (newMessage.value.trim() && canSendMessage.value) {
    const sentMessage = await chatStore.sendMessageToUser(newMessage.value, otherUserId.value)
    currentMessages.value.push(sentMessage)
    newMessage.value = ''
    messageCount.value++
    
    if (messageCount.value === 3) {
      needsAcceptance.value = true
    }
    
    // Notify other users in the room
    notificationStore.addNotification({
      type: 'message',
      content: `New message from ${currentUser.value.name} in room "${roomId.value}"`,
      link: `/chat/${roomId.value}`
    })
  }
}

const formatTime = (timestamp: string, timezone: string) => {
  return new Date(timestamp).toLocaleString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: timezone
  })
}

const getUserName = (userId: number) => {
  const user = userStore.users.find(u => u.id === userId)
  return user ? user.name : 'Unknown User'
}

const getUserTimezone = (userId: number) => {
  const user = userStore.users.find(u => u.id === userId)
  return user ? user.timezone : 'UTC'
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

const copyWord = (word: string) => {
  navigator.clipboard.writeText(word)
  // Puedes agregar una notificación aquí para indicar que la palabra se ha copiado
}

const translateWord = async (word: string) => {
  // Aquí iría la lógica para traducir la palabra
  // Por ejemplo, podrías usar una API de traducción
  console.log(`Traduciendo: ${word}`)
}

const acceptConversation = () => {
  chatStore.acceptConversation(roomId.value)
  needsAcceptance.value = false
}
</script>