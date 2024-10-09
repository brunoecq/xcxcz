import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getRooms, createRoom as apiCreateRoom, joinRoom as apiJoinRoom, leaveRoom as apiLeaveRoom } from '../api'
import { useNotificationStore } from './notificationStore'

interface Room {
  id: string;
  name: string;
  language: string;
  level: string;
  description: string;
  createdBy: number;
  userCount: number;
}

export const useRoomStore = defineStore('room', () => {
  const rooms = ref<Room[]>([])
  const notificationStore = useNotificationStore()

  const fetchRooms = async (page: number = 1, limit: number = 10): Promise<Room[]> => {
    try {
      const response = await getRooms(page, limit)
      if (Array.isArray(response.data)) {
        rooms.value = [...rooms.value, ...response.data]
        return response.data
      } else {
        console.error('Fetched rooms is not an array:', response.data)
        return []
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      return []
    }
  }

  const createRoom = async (roomData: Omit<Room, 'id' | 'userCount'>) => {
    try {
      const response = await apiCreateRoom(roomData)
      const newRoom = response.data
      rooms.value.push(newRoom)
      return newRoom
    } catch (error) {
      console.error('Error creating room:', error)
      throw error
    }
  }

  const joinRoom = async (roomId: string, userId: string) => {
    try {
      const response = await apiJoinRoom(roomId, userId)
      const updatedRoom = response.data
      const index = rooms.value.findIndex(r => r.id === roomId)
      if (index !== -1) {
        rooms.value[index] = updatedRoom
      }
      
      // Notify room creator
      if (updatedRoom.createdBy !== parseInt(userId)) {
        notificationStore.addNotification({
          type: 'room_join',
          content: `A new user has joined your room "${updatedRoom.name}"`,
          link: `/chat/${roomId}`
        })
      }
      
      return updatedRoom
    } catch (error) {
      console.error('Error joining room:', error)
      throw error
    }
  }

  const leaveRoom = async (roomId: string, userId: string) => {
    try {
      const response = await apiLeaveRoom(roomId, userId)
      const updatedRoom = response.data
      const index = rooms.value.findIndex(r => r.id === roomId)
      if (index !== -1) {
        rooms.value[index] = updatedRoom
      }
      return updatedRoom
    } catch (error) {
      console.error('Error leaving room:', error)
      throw error
    }
  }

  return { rooms, fetchRooms, createRoom, joinRoom, leaveRoom }
})