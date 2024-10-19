<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <!-- ... (previous template code remains unchanged) ... -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-for="message in currentMessages" :key="message.id" class="flex" :class="{ 'justify-end': message.senderId === currentUser.id }">
        <div :class="['max-w-xs lg:max-w-md px-4 py-2 rounded-lg', message.senderId === currentUser.id ? 'bg-blue-500 text-white' : 'bg-white']">
          <p class="font-semibold">{{ getUserName(message.senderId) }}</p>
          <p>{{ message.text }}</p>
          <p class="text-xs opacity-75">{{ formatTime(message.createdAt) }}</p>
        </div>
      </div>
    </div>
    <div class="bg-white p-4">
        <form @submit.prevent="sendMessage" class="flex space-x-2">
          <input v-model="newMessage" type="text" placeholder="Type a message..." class="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          <button type="button" @click="toggleEmojiPicker" class="px-4 py-2 bg-gray-200 rounded-md">😊</button>
          <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">Send</button>
        </form>
        <div v-if="showEmojiPicker" class="mt-2">
          <!-- Aquí iría el componente del selector de emojis -->
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '../stores/chatStore'
import { useUserStore } from '../stores/userStore'
import { useAuthStore } from '../stores/authStore'
import { socket } from '../api'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const userStore = useUserStore()
const authStore = useAuthStore()

const userId = computed(() => route.params.userId as string)
const currentUser = computed(() => authStore.user)
const currentMessages = ref([])
const newMessage = ref('')
const showEmojiPicker = ref(false)

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  await loadMessages()

  socket.on('new_message', (message) => {
    if (message.senderId === userId.value || message.receiverId === userId.value) {
      currentMessages.value.push(message)
    }
  })
})

watch(() => route.params.userId, async (newUserId) => {
  if (newUserId) {
    await loadMessages()
  }
})

const loadMessages = async () => {
  const messages = await chatStore.fetchMessages(currentUser.value.id.toString(), userId.value)
  currentMessages.value = messages
}

const sendMessage = async () => {
  if (newMessage.value.trim()) {
    const sentMessage = await chatStore.sendMessageToUser(newMessage.value, userId.value)
    currentMessages.value.push(sentMessage)
    newMessage.value = ''
  }
}

const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: currentUser.value.timezone
    })
  }
  
  const getUserName = (userId: string) => {
    const user = userStore.users.find(u => u.id.toString() === userId)
    return user ? user.name : 'Unknown User'
  }
  
  const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value
  }

</script>