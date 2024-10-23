import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, updateProfile as apiUpdateProfile, refreshToken } from '../api'
import { socket } from '../api'
import { useNotificationStore } from './notificationStore'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const router = useRouter()

  const isAuthenticated = computed(() => !!token.value)

  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  }

  const setUserFromToken = (token: string) => {
    const decodedToken = decodeToken(token)
    if (decodedToken) {
      user.value = {
        id: decodedToken.id,
        email: decodedToken.email,
        name: decodedToken.name
      }
    }
  }

  const setupSocketListeners = () => {
    socket.on('new_message', (message) => {
      const notificationStore = useNotificationStore()
      const currentRoute = router.currentRoute.value
      const isInChat = currentRoute.name === 'UserChat' && currentRoute.params.userId == message.senderId
      const isInRoom = currentRoute.name === 'ChatRoom' && currentRoute.params.roomId == message.roomId
      const isSender = message.senderId == user.value?.id

      if (!isSender && !isInChat && !isInRoom) {
        notificationStore.addNotification({
          type: 'message',
          content: `New message from ${message.senderName || 'Unknown User'}`,
          link: message.roomId ? `/chat/room/${message.roomId}` : `/chat/user/${message.senderId}`
        })
      }
    })

    socket.on('connect', () => {
      if (user.value) {
        socket.emit('join', user.value.id)
      }
    })
  }

  const loginUser = async (email: string, password: string) => {
    try {
      const response = await login(email, password)
      token.value = response.data.token
      localStorage.setItem('token', token.value)
      setUserFromToken(token.value)
      setupSocketListeners()
      startRefreshTokenTimer()
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const registerUser = async (userData: any) => {
    try {
      await register(userData)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const logout = () => {
    socket.off('new_message')
    socket.off('connect')
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    stopRefreshTokenTimer()
  }

  const updateProfile = async (profileData: any) => {
    try {
      const response = await apiUpdateProfile(profileData)
      user.value = response.data
      return response.data
    } catch (error) {
      console.error('Profile update failed:', error)
      throw error
    }
  }

  let refreshTokenTimeout: number

  const startRefreshTokenTimer = () => {
    const jwtToken = decodeToken(token.value)
    if (jwtToken && jwtToken.exp) {
      const expires = new Date(jwtToken.exp * 1000)
      const timeout = expires.getTime() - Date.now() - (60 * 1000)
      refreshTokenTimeout = setTimeout(refreshTokenFn, timeout)
    }
  }

  const stopRefreshTokenTimer = () => {
    clearTimeout(refreshTokenTimeout)
  }

  const refreshTokenFn = async () => {
    try {
      const response = await refreshToken()
      token.value = response.data.token
      localStorage.setItem('token', token.value)
      setUserFromToken(token.value)
      startRefreshTokenTimer()
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
    }
  }

  const initAuth = () => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      token.value = storedToken
      setUserFromToken(storedToken)
      setupSocketListeners()
      startRefreshTokenTimer()
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }
      const profileData = await response.json()
      user.value = profileData
      return profileData
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
  }

  return { 
    user, 
    token, 
    isAuthenticated, 
    loginUser, 
    registerUser, 
    logout, 
    updateProfile, 
    initAuth, 
    fetchUserProfile 
  }
})