import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, updateProfile as apiUpdateProfile, refreshToken } from '../api'
import { socket } from '../api'
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
    socket.off('connect')

    socket.on('connect', () => {
      if (user.value) {
        socket.emit('join', user.value.id)
        socket.emit('user_status', {
          userId: user.value.id,
          status: 'online'
        })
      }
    })

    socket.io.on('reconnect', () => {
      if (user.value) {
        socket.emit('join', user.value.id)
        socket.emit('user_status', {
          userId: user.value.id,
          status: 'online'
        })
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
      
      if (!socket.connected) {
        socket.connect()
      }
      socket.emit('join', user.value.id)
      socket.emit('user_status', {
        userId: user.value.id,
        status: 'online'
      })
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
    if (user.value) {
      socket.emit('user_status', {
        userId: user.value.id,
        status: 'offline'
      })
    }
    socket.off('connect')
    socket.disconnect()
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

  const initAuth = async () => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      token.value = storedToken
      setUserFromToken(storedToken)
      setupSocketListeners()
      startRefreshTokenTimer()
      
      try {
        await fetchUserProfile()
        if (!socket.connected) {
          socket.connect()
        }
        socket.emit('join', user.value.id)
        socket.emit('user_status', {
          userId: user.value.id,
          status: 'online'
        })
      } catch (error) {
        console.error('Error initializing auth:', error)
        logout()
      }
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