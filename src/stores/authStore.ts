import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, updateProfile as apiUpdateProfile, refreshToken } from '../api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)

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
        // Añade aquí otros campos del usuario que estén en el token
      }
    }
  }

  const loginUser = async (email: string, password: string) => {
    try {
      const response = await login(email, password)
      token.value = response.data.token
      localStorage.setItem('token', token.value)
      setUserFromToken(token.value)
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

  // Initialize the auth state
  const initAuth = () => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      token.value = storedToken
      setUserFromToken(storedToken)
      startRefreshTokenTimer()
    }
  }

  return { user, token, isAuthenticated, loginUser, registerUser, logout, updateProfile, initAuth }
})