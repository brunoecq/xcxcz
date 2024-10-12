<template>
  <div class="container mx-auto px-4 py-8">
    <h2 class="text-2xl font-semibold mb-6">Rooms</h2>
    <div class="mb-4">
      <label for="languageFilter" class="block text-sm font-medium text-gray-700">Filter by Language:</label>
      <select v-model="selectedLanguage" id="languageFilter" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
        <option value="">All Languages</option>
        <option v-for="lang in languages" :key="lang.code" :value="lang.name">{{ lang.name }}</option>
      </select>
    </div>
    <div v-if="filteredRooms.length === 0" class="text-center text-gray-500">
      No rooms found.
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="room in filteredRooms" :key="room.id" class="bg-white shadow-md rounded-lg p-6">
        <h3 class="text-xl font-semibold mb-2">{{ room.name }}</h3>
        <p class="text-gray-600 mb-2">Language: {{ room.language }}</p>
        <p class="text-gray-600 mb-2">Level: {{ room.level }}</p>
        <p class="text-gray-600 mb-4">Users: {{ room.userCount }}</p>
        <button @click="joinRoom(room.id)" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Join Room
        </button>
      </div>
    </div>
    <div ref="loadMoreTrigger" class="text-center py-4">
      <p v-if="loading">Loading more rooms...</p>
    </div>

    <!-- Modal para crear una nueva sala -->
    <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-bold mb-4">Create New Room</h3>
        <form @submit.prevent="createRoom">
          <div class="mb-4">
            <label for="roomName" class="block text-sm font-medium text-gray-700">Room Name</label>
            <input v-model="newRoom.name" type="text" id="roomName" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
          </div>
          <div class="mb-4">
            <label for="roomLanguage" class="block text-sm font-medium text-gray-700">Language</label>
            <select v-model="newRoom.language" id="roomLanguage" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option v-for="lang in languages" :key="lang.code" :value="lang.name">{{ lang.name }}</option>
            </select>
          </div>
          <div class="mb-4">
            <label for="roomLevel" class="block text-sm font-medium text-gray-700">Level</label>
            <select v-model="newRoom.level" id="roomLevel" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div class="mb-4">
            <label for="roomDescription" class="block text-sm font-medium text-gray-700">Description</label>
            <textarea v-model="newRoom.description" id="roomDescription" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
          </div>
          <div class="flex justify-end">
            <button type="button" @click="showModal = false" class="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded">Create</button>
          </div>
        </form>
      </div>
    </div>

    <button @click="showModal = true" class="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
      Create New Room
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoomStore } from '../stores/roomStore'
import { useAuthStore } from '../stores/authStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useRouter } from 'vue-router'
import languagesData from '../data/languages.json'

const roomStore = useRoomStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const router = useRouter()

const rooms = ref([])
const languages = ref(languagesData)
const newRoom = ref({ name: '', language: '', level: '', description: '' })
const showModal = ref(false)
const page = ref(1)
const loading = ref(false)
const loadMoreTrigger = ref(null)
const selectedLanguage = ref('')

const filteredRooms = computed(() => {
  if (!selectedLanguage.value) return rooms.value
  return rooms.value.filter(room => room.language === selectedLanguage.value)
})

onMounted(async () => {
  loadRooms()
  const observer = new IntersectionObserver(handleIntersect)
  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
})

onUnmounted(() => {
  if (loadMoreTrigger.value && observer) {
    observer.unobserve(loadMoreTrigger.value)
  }
})

const loadRooms = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const newRooms = await roomStore.fetchRooms(page.value)
    rooms.value = [...rooms.value, ...newRooms]
    page.value++
  } catch (error) {
    console.error('Error fetching rooms:', error)
  } finally {
    loading.value = false
  }
}

const handleIntersect = (entries) => {
  if (entries[0].isIntersecting) {
    loadRooms()
  }
}

const joinRoom = async (roomId: string) => {
  if (!authStore.user) {
    router.push('/login')
    return
  }
  try {
    await roomStore.joinRoom(roomId, authStore.user.id.toString())
    router.push(`/chat/${roomId}`)
  } catch (error) {
    console.error('Error joining room:', error)
  }
}

const createRoom = async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }
  try {
    const createdRoom = await roomStore.createRoom({
      ...newRoom.value,
      createdBy: authStore.user.id
    })
    rooms.value.unshift(createdRoom)
    showModal.value = false
    newRoom.value = { name: '', language: '', level: '', description: '' }
    
    // Notify user about room creation
    notificationStore.addNotification({
      type: 'system',
      content: `You have successfully created the room "${createdRoom.name}"`,
      link: `/chat/${createdRoom.id}`
    })
  } catch (error) {
    console.error('Error creating room:', error)
  }
}
</script>