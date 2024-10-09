<template>
  <div class="bg-white p-4 rounded shadow">
    <h2 class="text-xl font-semibold mb-2">Rooms</h2>
    <ul>
      <li v-for="room in rooms" :key="room.id" class="mb-2">
        {{ room.name }}
        <button @click="joinRoom(room.id)" class="ml-2 bg-green-500 text-white px-2 py-1 rounded">Join</button>
      </li>
    </ul>
    <form @submit.prevent="createRoom" class="mt-4">
      <input v-model="newRoomName" type="text" placeholder="New room name" class="w-full p-2 border rounded mb-2">
      <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Create Room</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoomStore } from '../stores/roomStore'

const roomStore = useRoomStore()
const rooms = ref(roomStore.rooms)
const newRoomName = ref('')

const joinRoom = (roomId: string) => {
  roomStore.joinRoom(roomId)
}

const createRoom = () => {
  if (newRoomName.value.trim()) {
    roomStore.createRoom(newRoomName.value)
    newRoomName.value = ''
  }
}
</script>