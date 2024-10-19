<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <div class="bg-white shadow-md p-4">
      <h2 class="text-2xl font-bold">{{ room?.name }}</h2>
      <p>{{ $t('language') }}: {{ room?.language }} - {{ $t('level') }}: {{ room?.level }}</p>
      <p>{{ $t('host') }}: {{ room?.host.name }}</p>
      <p v-if="room?.coHost">{{ $t('coHost') }}: {{ room.coHost.name }}</p>
    </div>
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
        <input v-model="newMessage" type="text" :placeholder="$t('typeMessage')" class="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        <button type="button" @click="toggleEmojiPicker" class="px-4 py-2 bg-gray-200 rounded-md">😊</button>
        <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">{{ $t('send') }}</button>
      </form>
      <div v-if="showEmojiPicker" class="mt-2">
        <!-- Aquí iría el componente del selector de emojis -->
      </div>
    </div>
    <div class="bg-white p-4 flex justify-between items-center">
      <div>
        <span class="font-bold">{{ $t('participants') }}:</span>
        <span v-for="user in room?.users" :key="user.id" class="ml-2">{{ user.name }}</span>
      </div>
      <div v-if="isHost || isCoHost">
        <button @click="showAssignCoHostModal = true" class="bg-green-500 text-white px-4 py-2 rounded-md mr-2">{{ $t('assignCoHost') }}</button>
      </div>
      <button @click="leaveRoom" class="bg-red-500 text-white px-4 py-2 rounded-md">{{ $t('leaveRoom') }}</button>
    </div>
  </div>

  <!-- Modal para asignar co-anfitrión -->
  <div v-if="showAssignCoHostModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <h3 class="text-lg font-bold mb-4">{{ $t('assignCoHost') }}</h3>
      <select v-model="selectedCoHost" class="w-full p-2 border rounded-md mb-4">
        <option v-for="user in room?.users" :key="user.id" :value="user.id">{{ user.name }}</option>
      </select>
      <div class="flex justify-end">
        <button @click="showAssignCoHostModal = false" class="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded">{{ $t('cancel') }}</button>
        <button @click="assignCoHost" class="px-4 py-2 bg-blue-500 text-white rounded">{{ $t('assign') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '../stores/roomStore'
import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../stores/authStore'
import { useI18n } from 'vue-i18n'
import { socket } from '../api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()
const chatStore = useChatStore()
const authStore = useAuthStore()

debugger
const room = computed(() => roomStore.rooms.find(r => r.id == route.params.roomId))
const currentUser = computed(() => authStore.user)
const currentMessages = ref([])
const newMessage = ref('')
const showEmojiPicker = ref(false)
const showAssignCoHostModal = ref(false)
const selectedCoHost = ref('')

const isHost = computed(() => room.value?.host.id === currentUser.value?.id)
const isCoHost = computed(() => room.value?.coHost?.id === currentUser.value?.id)

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  await loadMessages()
  joinRoom()

  socket.on('new_message', (message) => {
    if (message.roomId === route.params.roomId) {
      currentMessages.value.push(message)
    }
  })

  socket.on('user_joined', (user) => {
    if (room.value) {
      room.value.users.push(user)
    }
  })

  socket.on('user_left', (userId) => {
    if (room.value) {
      room.value.users = room.value.users.filter(u => u.id !== userId)
    }
  })

  socket.on('cohost_assigned', (userId) => {
    if (room.value) {
      const user = room.value.users.find(u => u.id === userId)
      if (user) {
        room.value.coHost = user
      }
    }
  })
})

watch(() => route.params.roomId, async (newRoomId) => {
  if (newRoomId) {
    await loadMessages()
    joinRoom()
  }
})

const loadMessages = async () => {
  currentMessages.value = await chatStore.fetchRoomMessages(route.params.roomId as string)
}

const joinRoom = () => {
  if (room.value && currentUser.value) {
    socket.emit('join_room', { roomId: room.value.id, user: { id: currentUser.value.id, name: currentUser.value.name } })
  }
}

const sendMessage = async () => {
  debugger
  if (newMessage.value.trim() && room.value) {
    const sentMessage = await chatStore.sendMessageToRoom(newMessage.value, room.value.id)
    currentMessages.value.push(sentMessage)
    newMessage.value = ''
  }
}

const leaveRoom = async () => {
  if (room.value) {
    await roomStore.leaveRoom(room.value.id, currentUser.value.id)
    socket.emit('leave_room', { roomId: room.value.id, userId: currentUser.value.id })
    router.push('/rooms')
  }
}

const assignCoHost = () => {
  if (room.value && selectedCoHost.value) {
    roomStore.assignCoHost(room.value.id, selectedCoHost.value)
    showAssignCoHostModal.value = false
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
  if (room.value) {
    const user = room.value.users.find(u => u.id === userId)
    return user ? user.name : 'Unknown User'
  }
  return 'Unknown User'
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}
</script>
