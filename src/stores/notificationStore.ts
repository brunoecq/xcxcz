import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from './authStore'

export interface Notification {
  id: number
  type: 'room_join' | 'message' | 'system'
  content: string
  isRead: boolean
  link?: string
  createdAt: Date
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const authStore = useAuthStore()
  let notificationHandled = new Set()

  const addNotification = async (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    // Evitar duplicados usando un identificador único
    const notificationId = `${notification.type}-${notification.content}-${Date.now()}`
    if (notificationHandled.has(notificationId)) {
      return
    }
    notificationHandled.add(notificationId)

    // Limpiar identificadores antiguos (después de 5 segundos)
    setTimeout(() => {
      notificationHandled.delete(notificationId)
    }, 5000)

    const newNotification = {
      ...notification,
      id: Date.now(),
      isRead: false,
      createdAt: new Date()
    }

    try {
      // Guardar en la base de datos
      if (authStore.user) {
        await axios.post('/api/notifications', {
          userId: authStore.user.id,
          ...notification
        })
      }
    } catch (error) {
      console.error('Error saving notification:', error)
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

  const loadNotifications = async () => {
    if (!authStore.user) return

    try {
      const response = await axios.get(`/api/notifications/${authStore.user.id}`)
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
      await axios.put(`/api/notifications/${id}/read`)
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
      await axios.delete(`/api/notifications/${id}`)
      notifications.value = notifications.value.filter(n => n.id !== id)
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getUnreadCount = () => {
    return notifications.value.filter(n => !n.isRead).length
  }

  const clearAll = async () => {
    if (!authStore.user) return

    try {
      await axios.delete(`/api/notifications/user/${authStore.user.id}`)
      notifications.value = []
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  // Request notification permission on store initialization
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }

  return {
    notifications,
    addNotification,
    loadNotifications,
    markAsRead,
    deleteNotification,
    getUnreadCount,
    clearAll
  }
})