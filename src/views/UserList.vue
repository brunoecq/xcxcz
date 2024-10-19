<template>
  <div class="container mx-auto px-4 py-8">
    <h2 class="text-2xl font-semibold mb-6">{{ $t('users') }}</h2>
    <div class="mb-4">
      <button @click="startRandomCall" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
        {{ $t('startRandomCall') }}
      </button>
    </div>
    <div v-if="users.length === 0" class="text-center text-gray-500">
      {{ $t('noUsersFound') }}
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="user in users" :key="user.id" class="bg-white shadow-md rounded-lg p-6">
        <div class="flex items-center mb-4">
          <img :src="`https://i.pravatar.cc/150?u=${user.id}`" :alt="user.name" class="w-16 h-16 rounded-full mr-4">
          <div>
            <h3 class="text-xl font-semibold flex items-center">
              {{ user.name }}
              <UserStatusIndicator :status="user.status" class="ml-2" />
            </h3>
            <p class="text-gray-600">{{ user.email }}</p>
            <p class="text-sm text-gray-500">{{ $t('currentTime') }}: {{ getCurrentTime(user.timezone) }}</p>
          </div>
        </div>
        <p v-if="user.nativeLanguage" class="text-sm text-gray-500 mb-2">
          {{ $t('native') }}: {{ user.nativeLanguage }}
        </p>
        <p v-if="user.learningLanguages && user.learningLanguages.length > 0" class="text-sm text-gray-500 mb-2">
          {{ $t('learning') }}:
          <span v-for="(lang, index) in user.learningLanguages" :key="index">
            {{ lang.name }} ({{ lang.level }}){{ index < user.learningLanguages.length - 1 ? ', ' : '' }}
          </span>
        </p>
        <p v-if="user.country" class="text-sm text-gray-500 mb-4">
          {{ $t('country') }}: {{ user.country }}
        </p>
        <p class="text-sm text-gray-500 mb-2">
          {{ $t('allowRandomCalls') }}: {{ user.allowRandomCalls ? $t('yes') : $t('no') }}
        </p>
        <p class="text-sm text-gray-500 mb-4">
          {{ $t('availability') }}:
          <span v-for="(slot, index) in user.availability" :key="index">
            {{ slot.day }} {{ slot.startTime }}-{{ slot.endTime }}{{ index < user.availability.length - 1 ? ', ' : '' }}
          </span>
        </p>
        <div class="flex space-x-2">
          <button @click="startChat(user.id)" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            {{ $t('chat') }}
          </button>
          <button @click="startVideoCall(user.id)" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
            {{ $t('videoCall') }}
          </button>
        </div>
      </div>
    </div>
    <div ref="loadMoreTrigger" class="text-center py-4">
      <p v-if="loading">{{ $t('loadingMoreUsers') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../stores/userStore'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import UserStatusIndicator from '../components/UserStatusIndicator.vue'

const { t } = useI18n()
const userStore = useUserStore()
const router = useRouter()
const users = ref([])
const page = ref(1)
const loading = ref(false)
const loadMoreTrigger = ref(null)

const loadUsers = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const newUsers = await userStore.fetchUsers(page.value)
    users.value = [...users.value, ...newUsers]
    page.value++
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loading.value = false
  }
}

const handleIntersect = (entries) => {
  if (entries[0].isIntersecting) {
    loadUsers()
  }
}

onMounted(() => {
  loadUsers()
  const observer = new IntersectionObserver(handleIntersect, {
    root: null,
    rootMargin: '0px',
    threshold: 1.0
  })
  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
})

onUnmounted(() => {
  if (loadMoreTrigger.value) {
    const observer = new IntersectionObserver(handleIntersect)
    observer.unobserve(loadMoreTrigger.value)
  }
})

const startChat = (userId: number) => {
  router.push(`/chat/user/${userId}`)
}

const startVideoCall = (userId: number) => {
  router.push(`/video-call/${userId}?initiator=true`)
}

const getCurrentTime = (timezone: string) => {
  return new Date().toLocaleString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })
}

const formatAvailability = (availability: { day: string, startTime: string, endTime: string }[]) => {
  return availability.map(slot => `${slot.day} ${slot.startTime}-${slot.endTime}`).join(', ')
}

const startRandomCall = async () => {
  try {
    const randomUser = await userStore.findRandomUser()
    if (randomUser) {
      router.push(`/video-call/${randomUser.id}?initiator=true`)
    } else {
      alert(t('noAvailableUsers'))
    }
  } catch (error) {
    console.error('Error starting random call:', error)
    alert(t('errorStartingRandomCall'))
  }
}
</script>