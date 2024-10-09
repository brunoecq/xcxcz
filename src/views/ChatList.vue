<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <div class="w-1/4 bg-white border-r">
      <h2 class="text-2xl font-bold p-4 border-b">{{ $t('myChats') }}</h2>
      <div class="overflow-y-auto h-full">
        <div 
          v-for="chat in chats" 
          :key="chat.id" 
          @click="selectChat(chat)"
          class="p-4 border-b hover:bg-gray-100 cursor-pointer"
          :class="{ 'bg-blue-100': selectedChat && selectedChat.id === chat.id }"
        >
          <div class="flex items-center">
            <img :src="`https://i.pravatar.cc/40?u=${chat.otherUserId}`" :alt="chat.name" class="w-10 h-10 rounded-full mr-3">
            <div>
              <h3 class="font-semibold flex items-center">
                {{ chat.name }}
                <UserStatusIndicator :status="getUserStatus(chat.otherUserId)" class="ml-2" />
              </h3>
              <p class="text-sm text-gray-600 truncate">{{ chat.lastMessage }}</p>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-1">{{ formatDate(chat.lastMessageDate) }}</p>
        </div>
      </div>
    </div>

    <!-- Chat Area -->
    <div class="flex-1 flex flex-col">
      <div v-if="selectedChat" class="flex-1 p-4 overflow-y-auto">
        <h2 class="text-2xl font-bold mb-4">Chat with {{ selectedChat.name }}</h2>
        <!-- Chat messages would go here -->
      </div>
      <div v-else class="flex-1 flex items-center justify-center text-gray-500">
        {{ $t('selectChatToStart') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useChatStore } from '../stores/chatStore'
import { useUserStore } from '../stores/userStore'
import { useAuthStore } from '../stores/authStore'
import { useI18n } from 'vue-i18n'
import UserStatusIndicator from '../components/UserStatusIndicator.vue'

const { t } = useI18n()
const chatStore = useChatStore()
const userStore = useUserStore()
const authStore = useAuthStore()
const chats = ref([])
const selectedChat = ref(null)

onMounted(async () => {
  if (authStore.user) {
    chats.value = await chatStore.fetchUserChats(authStore.user.id.toString())
  }
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

const selectChat = (chat) => {
  selectedChat.value = chat
}

const getUserStatus = (userId: number) => {
  const user = userStore.users.find(u => u.id === userId)
  return user ? user.status : 'offline'
}
</script>