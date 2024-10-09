<template>
  <div class="bg-white p-4 rounded shadow">
    <h2 class="text-xl font-semibold mb-2">Users</h2>
    <ul>
      <li v-for="user in users" :key="user.id" class="mb-2">
        {{ user.name }}
        <button @click="startVideoCall(user.id)" class="ml-2 bg-blue-500 text-white px-2 py-1 rounded">Call</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../stores/userStore'

const userStore = useUserStore()
const users = ref(userStore.users)

const startVideoCall = (userId: string) => {
  // Implement WebRTC video call logic here
  console.log(`Starting video call with user ${userId}`)
}
</script>