<template>
  <div class="bg-white p-4 rounded shadow">
    <h2 class="text-xl font-semibold mb-2">Chat Room: {{ currentRoom }}</h2>
    <div class="h-64 overflow-y-auto mb-4 border p-2">
      <div v-for="message in messages" :key="message.id" class="mb-2">
        <strong>{{ message.user }}:</strong> {{ message.text }}
      </div>
    </div>
    <form @submit.prevent="sendMessage">
      <input v-model="newMessage" type="text" placeholder="Type a message..." class="w-full p-2 border rounded">
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '../stores/chatStore'

const chatStore = useChatStore()
const currentRoom = ref(chatStore.currentRoom)
const messages = ref(chatStore.messages)
const newMessage = ref('')

const sendMessage = () => {
  if (newMessage.value.trim()) {
    chatStore.sendMessage(newMessage.value)
    newMessage.value = ''
  }
}
</script>