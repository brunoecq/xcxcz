import { defineStore } from 'pinia'
import { ref } from 'vue'

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

  const addNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    notifications.value.push({
      ...notification,
      id: Date.now(),
      isRead: false,
      createdAt: new Date()
    })
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

  return { notifications, addNotification, markAsRead, deleteNotification, getUnreadCount }
})