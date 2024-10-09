<template>
  <div class="relative">
    <button @click="toggleNotifications" class="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
      <span class="sr-only">View notifications</span>
      <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span v-if="unreadCount > 0" class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{{ unreadCount }}</span>
    </button>

    <div v-if="showNotifications" class="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
      <div v-if="notifications.length === 0" class="px-4 py-2 text-sm text-gray-700">
        No notifications
      </div>
      <div v-else v-for="notification in notifications" :key="notification.id" class="px-4 py-2 flex items-center justify-between" :class="{ 'bg-gray-100': !notification.isRead }">
        <div>
          <p class="text-sm font-medium text-gray-900" @click="handleNotificationClick(notification)">
            {{ notification.content }}
          </p>
          <p class="text-xs text-gray-500">
            {{ formatDate(notification.createdAt) }}
          </p>
        </div>
        <button @click="deleteNotification(notification.id)" class="text-gray-400 hover:text-gray-500">
          <span class="sr-only">Delete notification</span>
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNotificationStore } from '../stores/notificationStore'
import { useRouter } from 'vue-router'

const notificationStore = useNotificationStore()
const router = useRouter()

const showNotifications = ref(false)
const notifications = computed(() => notificationStore.notifications)
const unreadCount = computed(() => notificationStore.getUnreadCount())

const toggleNotifications = () => {
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
  return new Date(date).toLocaleString()
}
</script>