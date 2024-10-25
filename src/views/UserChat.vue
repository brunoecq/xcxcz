<template>
  <div class="flex flex-col h-[700px] bg-gray-100">
    <div class="bg-white shadow-md p-4">
      <h2 class="text-2xl font-bold">Chat with {{ otherUser?.name }}</h2>
    </div>
    <div class="flex-1 overflow-y-auto p-4" ref="chatContainer" @scroll="handleScroll">
      <div v-if="loading" class="text-center py-2">
        <p class="text-gray-500">Loading older messages...</p>
      </div>
      <div class="flex flex-col space-y-4">
        <div v-for="message in currentMessages" :key="message.id" class="flex" :class="{ 'justify-end': message.senderId == currentUser.id }">
          <div :class="['max-w-xs lg:max-w-md px-4 py-2 rounded-lg', message.senderId == currentUser.id ? 'bg-blue-500 text-white' : 'bg-white']">
            <p class="font-semibold">{{ getUserName(message.senderId) }}</p>
            <p>{{ message.text }}</p>
            <p class="text-xs opacity-75">{{ formatTime(message.createdAt) }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="bg-white p-4 relative">
      <form @submit.prevent="sendMessage" class="flex space-x-2">
        <input v-model="newMessage" type="text" placeholder="Type a message..." class="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        <button type="button" @click="toggleEmojiPicker" class="px-4 py-2 bg-gray-200 rounded-md">😊</button>
        <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">Send</button>
      </form>
      <div v-if="showEmojiPicker" class="absolute bottom-full right-0 mb-2">
        <emoji-picker @emoji-click="onEmojiSelect"></emoji-picker>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '../stores/chatStore'
import { useUserStore } from '../stores/userStore'
import { useAuthStore } from '../stores/authStore'
import { socket } from '../api'
import 'emoji-picker-element'

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
const chatContainer = ref(null)
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

const otherUser = computed(() => userStore.users.find(u => u.id.toString() === userId.value))

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  await loadUsers()
  await loadMessages()
  scrollToBottom()
  setupSocketListeners()

  // Close emoji picker when clicking outside
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  socket.off('new_message')
  socket.emit('leave', `user_${currentUser.value.id}`)
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('emoji-picker') && !target.closest('button')) {
    showEmojiPicker.value = false
  }
}

const loadUsers = async () => {
  if (userStore.users.length === 0) {
    await userStore.fetchUsers()
  }
}

const setupSocketListeners = () => {
  socket.emit('join', `${currentUser.value.id}`)

  socket.on('new_message', (message) => {
    if (
      (message.senderId === currentUser.value.id.toString() && message.receiverId === userId.value) ||
      (message.senderId === userId.value && message.receiverId === currentUser.value.id.toString())
    ) {
      currentMessages.value.push(message)
      nextTick(() => {
        scrollToBottom()
      })
    }
  })
}

watch(() => route.params.userId, async (newUserId) => {
  if (newUserId) {
    page.value = 1
    hasMore.value = true
    currentMessages.value = []
    await loadMessages()
    scrollToBottom()
  }
})

const loadMessages = async (loadMore = false) => {
  if (loading.value || (!loadMore && currentMessages.value.length > 0)) return
  
  loading.value = true
  try {
    const messages = await chatStore.fetchMessages(
      currentUser.value.id.toString(),
      userId.value,
      page.value
    )
    
    if (messages.length === 0) {
      hasMore.value = false
    } else {
      if (loadMore) {
        currentMessages.value = [...messages, ...currentMessages.value]
        // Preserve scroll position
        nextTick(() => {
          if (chatContainer.value) {
            const firstNewMessage = chatContainer.value.querySelector('[data-message-id="' + messages[0].id + '"]')
            if (firstNewMessage) {
              firstNewMessage.scrollIntoView()
            }
          }
        })
      } else {
        currentMessages.value = messages
      }
      page.value++
    }
  } catch (error) {
    console.error('Error loading messages:', error)
  } finally {
    loading.value = false
  }
}

const handleScroll = async () => {
  if (!chatContainer.value || loading.value || !hasMore.value) return
  
  const { scrollTop } = chatContainer.value
  if (scrollTop === 0) {
    await loadMessages(true)
  }
}

const sendMessage = async () => {
  if (newMessage.value.trim()) {
    await chatStore.sendMessageToUser(newMessage.value, userId.value)

    const messageData = {
      senderId: currentUser.value.id.toString(),
      receiverId: userId.value,
      text: newMessage.value
    }
    socket.emit('send_message', messageData)
    currentMessages.value.push({
      ...messageData,
      id: Date.now(),
      createdAt: new Date().toISOString()
    })
    newMessage.value = ''
    nextTick(() => {
      scrollToBottom()
    })
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
  if (userId == currentUser.value.id) {
    return currentUser.value.name
  }
  return otherUser.value ? otherUser.value.name : 'Unknown User'
}

const toggleEmojiPicker = (event: MouseEvent) => {
  event.stopPropagation()
  showEmojiPicker.value = !showEmojiPicker.value
}

const onEmojiSelect = (event: CustomEvent) => {
  newMessage.value += event.detail.unicode
  showEmojiPicker.value = false
}

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}
</script>

<style scoped>
emoji-picker {
  width: 300px;
  height: 400px;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-radius: 0.5rem;
}
</style>