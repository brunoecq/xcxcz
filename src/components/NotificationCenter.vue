<template>
  <div class="relative inline-block notification-center">
    <button @click="toggleNotifications" class="relative p-2 text-white hover:text-gray-200 focus:outline-none">
      <span class="sr-only">View notifications</span>
      <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span v-if="unreadCount > 0" class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
        {{ unreadCount }}
      </span>
    </button>

    <div v-if="showNotifications" class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50">
      <div v-if="notifications.length === 0" class="px-4 py-2 text-sm text-gray-700">
        No notifications
      </div>
      <div v-else>
        <div v-for="notification in sortedNotifications" :key="notification.id" 
             class="px-4 py-2 hover:bg-gray-50 cursor-pointer"
             :class="{ 'bg-blue-50': !notification.isRead }"
             @click="handleNotificationClick(notification)">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <p class="text-sm text-gray-900">{{ notification.content }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ formatDate(notification.createdAt) }}</p>
            </div>
            <button @click.stop="deleteNotification(notification.id)" 
                    class="ml-2 text-gray-400 hover:text-gray-600">
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '../stores/notificationStore'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

const router = useRouter()
const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)

const showNotifications = ref(false)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // Cargar notificaciones al montar el componente
  notificationStore.loadNotifications()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const sortedNotifications = computed(() => {
  return [...notifications.value].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
})

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.isRead).length
})

const toggleNotifications = (event: Event) => {
  event.stopPropagation()
  showNotifications.value = !showNotifications.value
}

const handleNotificationClick = (notification) => {
  notificationStore.markAsRead(notification.id)
  if (notification.link) {
    router.push(notification.link)
  }
  showNotifications.value = false
}

const deleteNotification = (id: number) => {
  notificationStore.deleteNotification(id)
}

const formatDate = (date: Date) => {
  const minutes = Math.ceil((date.getTime() - Date.now()) / (1000 * 60))
  if (minutes > -60) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(minutes, 'minute')
  }
  if (minutes > -1440) { // Less than a day
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.ceil(minutes / 60), 'hour')
  }
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.ceil(minutes / 1440), 'day')
}

const handleClickOutside = (event: MouseEvent) => {
  if (showNotifications.value && !event.target.closest('.notification-center')) {
    showNotifications.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>