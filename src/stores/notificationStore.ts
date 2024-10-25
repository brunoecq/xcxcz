import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getNotifications, addNotification as apiAddNotification, markNotificationAsRead, deleteNotification as apiDeleteNotification, clearNotifications } from '../api'
import { useAuthStore } from './authStore'

export interface Notification {
  id: number;
  type: 'room_join' | 'message' | 'system';
  content: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const authStore = useAuthStore()
  const notificationHandled = ref(new Set())

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.isRead).length
  })

  const addNotification = async (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const notificationId = `${notification.type}-${notification.content}-${Date.now()}`
    if (notificationHandled.value.has(notificationId)) {
      return
    }
    notificationHandled.value.add(notificationId)

    setTimeout(() => {
      notificationHandled.value.delete(notificationId)
    }, 5000)

    const newNotification = {
      ...notification,
      id: Date.now(),
      isRead: false,
      createdAt: new Date()
    }

    try {
      if (authStore.user) {
        await apiAddNotification({
          userId: authStore.user.id,
          ...notification
        })
      }
    } catch (error) {
      console.error('Error saving notification:', error)
      return
    }

    notifications.value.push(newNotification)

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.content, {
        icon: '/vite.svg',
        badge: '/vite.svg'
      })
    }
  }

  const loadNotifications = async () => {
    if (!authStore.user) return

    try {
      const response = await getNotifications(authStore.user.id)
      notifications.value = response.data.map(n => ({
        ...n,
        createdAt: new Date(n.createdAt)
      }))
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id)
      const notification = notifications.value.find(n => n.id === id)
      if (notification) {
        notification.isRead = true
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      await apiDeleteNotification(id)
      notifications.value = notifications.value.filter(n => n.id !== id)
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const clearAll = async () => {
    if (!authStore.user) return

    try {
      await clearNotifications(authStore.user.id)
      notifications.value = []
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }

  return {
    notifications,
    unreadCount,
    addNotification,
    loadNotifications,
    markAsRead,
    deleteNotification,
    clearAll
  }
})