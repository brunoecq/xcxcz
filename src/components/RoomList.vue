<template>
  <div class="container mx-auto px-4 py-8">
    <h2 class="text-2xl font-semibold mb-6">{{ $t('rooms') }}</h2>
    <div class="mb-4">
      <label for="languageFilter" class="block text-sm font-medium text-gray-700">{{ $t('filterByLanguage') }}:</label>
      <select v-model="selectedLanguage" id="languageFilter" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
        <option value="">{{ $t('allLanguages') }}</option>
        <option v-for="lang in languages" :key="lang.code" :value="lang.name">{{ lang.name }}</option>
      </select>
    </div>
    <div v-if="filteredRooms.length === 0" class="text-center text-gray-500">
      {{ $t('noRoomsFound') }}
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="room in filteredRooms" :key="room.id" class="bg-white shadow-md rounded-lg p-6">
        <h3 class="text-xl font-semibold mb-2">{{ room.name }}</h3>
        <p class="text-gray-600 mb-2">{{ $t('language') }}: {{ room.language }}</p>
        <p class="text-gray-600 mb-2">{{ $t('level') }}: {{ room.level }}</p>
        <p class="text-gray-600 mb-2">{{ $t('host') }}: {{ room.host.name }}</p>
        <p v-if="room.coHost" class="text-gray-600 mb-2">{{ $t('coHost') }}: {{ room.coHost.name }}</p>
        <p class="text-gray-600 mb-4">{{ $t('users') }}: {{ room.users.length }}</p>
        <button @click="joinRoom(room.id)" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          {{ $t('joinRoom') }}
        </button>
      </div>
    </div>
    <div ref="loadMoreTrigger" class="text-center py-4">
      <p v-if="loading">{{ $t('loadingMoreRooms') }}</p>
    </div>

    <!-- Modal para crear una nueva sala -->
    <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-bold mb-4">{{ $t('createNewRoom') }}</h3>
        <form @submit.prevent="createRoom">
          <div class="mb-4">
            <label for="roomName" class="block text-sm font-medium text-gray-700">{{ $t('roomName') }}</label>
            <input v-model="newRoom.name" type="text" id="roomName" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
          </div>
          <div class="mb-4">
            <label for="roomLanguage" class="block text-sm font-medium text-gray-700">{{ $t('language') }}</label>
            <select v-model="newRoom.language" id="roomLanguage" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option v-for="lang in languages" :key="lang.code" :value="lang.name">{{ lang.name }}</option>
            </select>
          </div>
          <div class="mb-4">
            <label for="roomLevel" class="block text-sm font-medium text-gray-700">{{ $t('level') }}</label>
            <select v-model="newRoom.level" id="roomLevel" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="Beginner">{{ $t('beginner') }}</option>
              <option value="Intermediate">{{ $t('intermediate') }}</option>
              <option value="Advanced">{{ $t('advanced') }}</option>
            </select>
          </div>
          <div class="mb-4">
            <label for="roomDescription" class="block text-sm font-medium text-gray-700">{{ $t('description') }}</label>
            <textarea v-model="newRoom.description" id="roomDescription" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
          </div>
          <div class="flex justify-end">
            <button type="button" @click="showModal = false" class="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded">{{ $t('cancel') }}</button>
            <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded">{{ $t('create') }}</button>
          </div>
        </form>
      </div>
    </div>

    <button @click="showModal = true" class="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
      {{ $t('createNewRoom') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoomStore } from '../stores/roomStore'
import { useAuthStore } from '../stores/authStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import languagesData from '../data/languages.json'

const { t } = useI18n()
const roomStore = useRoomStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const router = useRouter()

const rooms = computed(() => roomStore.activeRooms)
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
  await loadRooms()
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
    await roomStore.fetchRooms(page.value)
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
    await roomStore.joinRoom(roomId, { id: authStore.user.id, name: authStore.user.name })
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
    showModal.value = false
    newRoom.value = { name: '', language: '', level: '', description: '' }
    
    notificationStore.addNotification({
      type: 'system',
      content: t('roomCreatedNotification', { roomName: createdRoom.name }),
      link: `/chat/${createdRoom.id}`
    })

    router.push(`/chat/${createdRoom.id}`)
  } catch (error) {
    console.error('Error creating room:', error)
  }
}
</script>