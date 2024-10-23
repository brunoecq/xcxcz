import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Notification {
  id: number
  type: 'room_join' |'message' | 'system'
  content: string
  isRead: boolean
  link?: string
  createdAt: Date
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotification = {
      ...notification,
      id: Date.now(),
      isRead: false,
      createdAt: new Date()
    }
    notifications.value.push(newNotification)

    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.content, {
        icon: '/vite.svg',
        badge: '/vite.svg'
      })
    }
  }

  const markAsRead = (id: number) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.isRead = true
    }
  }

  const deleteNotification = (id: number) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  const getUnreadCount = () => {
    return notifications.value.filter(n => !n.isRead).length
  }

  const clearAll = () => {
    notifications.value = []
  }

  // Request notification permission on store initialization
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }

  return {
    notifications,
    addNotification,
    markAsRead,
    deleteNotification,
    getUnreadCount,
    clearAll
  }
})