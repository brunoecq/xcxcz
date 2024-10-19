import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getRooms, createRoom as apiCreateRoom, joinRoom as apiJoinRoom, leaveRoom as apiLeaveRoom } from '../api'
import { useNotificationStore } from './notificationStore'
import { useAuthStore } from './authStore'
import { socket } from '../api'

export interface User {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  name: string;
  language: string;
  level: string;
  description: string;
  createdBy: string;
  host: User;
  coHost: User | null;
  users: User[];
  lastActivity: Date;
}

export const useRoomStore = defineStore('room', () => {
  const rooms = ref<Room[]>([])
  const notificationStore = useNotificationStore()
  const authStore = useAuthStore()

  const activeRooms = computed(() => rooms.value.filter(room => room.users.length > 0))

  const fetchRooms = async (page: number = 1, limit: number = 10): Promise<Room[]> => {
    try {
      const response = await getRooms(page, limit)
      if (Array.isArray(response.data)) {
        rooms.value = response.data.map(room => ({
          ...room,
          users: [],
          lastActivity: new Date()
        }))
        debugger
        return rooms.value
      } else {
        console.error('Fetched rooms is not an array:', response.data)
        return []
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      return []
    }
  }

  const createRoom = async (roomData: Omit<Room, 'id' | 'users' | 'lastActivity' | 'host' | 'coHost'>) => {
    try {
      const response = await apiCreateRoom(roomData)
      const newRoom: Room = {
        ...response.data,
        users: [{ id: authStore.user.id, name: authStore.user.name }],
        lastActivity: new Date(),
        host: { id: authStore.user.id, name: authStore.user.name },
        coHost: null
      }
      rooms.value.push(newRoom)
      socket.emit('room_created', newRoom)
      return newRoom
    } catch (error) {
      console.error('Error creating room:', error)
      throw error
    }
  }

  const joinRoom = async (roomId: string, user: User) => {
    try {
      const response = await apiJoinRoom(roomId, user.id)
      const roomIndex = rooms.value.findIndex(r => r.id === roomId)
      if (roomIndex !== -1) {
        rooms.value[roomIndex].users.push(user)
        rooms.value[roomIndex].lastActivity = new Date()
        socket.emit('user_joined_room', { roomId, user })
      }
      return rooms.value[roomIndex]
    } catch (error) {
      console.error('Error joining room:', error)
      throw error
    }
  }

  const leaveRoom = async (roomId: string, userId: string) => {
    try {
      await apiLeaveRoom(roomId, userId)
      const roomIndex = rooms.value.findIndex(r => r.id === roomId)
      if (roomIndex !== -1) {
        rooms.value[roomIndex].users = rooms.value[roomIndex].users.filter(u => u.id !== userId)
        rooms.value[roomIndex].lastActivity = new Date()
        if (rooms.value[roomIndex].host.id === userId) {
          if (rooms.value[roomIndex].coHost) {
            rooms.value[roomIndex].host = rooms.value[roomIndex].coHost
            rooms.value[roomIndex].coHost = null
          } else if (rooms.value[roomIndex].users.length > 0) {
            rooms.value[roomIndex].host = rooms.value[roomIndex].users[0]
          }
        }
        socket.emit('user_left_room', { roomId, userId })
      }
      return rooms.value[roomIndex]
    } catch (error) {
      console.error('Error leaving room:', error)
      throw error
    }
  }

  const assignCoHost = (roomId: string, userId: string) => {
    const roomIndex = rooms.value.findIndex(r => r.id === roomId)
    if (roomIndex !== -1) {
      const user = rooms.value[roomIndex].users.find(u => u.id === userId)
      if (user) {
        rooms.value[roomIndex].coHost = user
        socket.emit('cohost_assigned', { roomId, userId })
      }
    }
  }

  const removeInactiveRooms = () => {
    const now = new Date()
    rooms.value = rooms.value.filter(room => {
      const timeDiff = now.getTime() - room.lastActivity.getTime()
      return timeDiff <= 600000 // 10 minutes in milliseconds
    })
  }

  // Set up socket listeners
  socket.on('room_created', (room: Room) => {
    rooms.value.push(room)
  })

  socket.on('user_joined_room', ({ roomId, user }) => {
    const roomIndex = rooms.value.findIndex(r => r.id === roomId)
    if (roomIndex !== -1) {
      rooms.value[roomIndex].users.push(user)
      rooms.value[roomIndex].lastActivity = new Date()
    }
  })

  socket.on('user_left_room', ({ roomId, userId }) => {
    const roomIndex = rooms.value.findIndex(r => r.id === roomId)
    if (roomIndex !== -1) {
      rooms.value[roomIndex].users = rooms.value[roomIndex].users.filter(u => u.id !== userId)
      rooms.value[roomIndex].lastActivity = new Date()
    }
  })

  socket.on('cohost_assigned', ({ roomId, userId }) => {
    const roomIndex = rooms.value.findIndex(r => r.id === roomId)
    if (roomIndex !== -1) {
      const user = rooms.value[roomIndex].users.find(u => u.id === userId)
      if (user) {
        rooms.value[roomIndex].coHost = user
      }
    }
  })

  // Set up interval to remove inactive rooms
  //setInterval(removeInactiveRooms, 60000) // Check every minute

  return { 
    rooms, 
    activeRooms,
    fetchRooms, 
    createRoom, 
    joinRoom, 
    leaveRoom,
    assignCoHost
  }
})