import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, updateProfile as apiUpdateProfile, refreshToken } from '../api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)

  const isAuthenticated = computed(() => !!token.value)

  const loginUser = async (email: string, password: string) => {
    try {
      const response = await login(email, password)
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', token.value)
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
    const jwtToken = JSON.parse(atob(token.value.split('.')[1]))
    const expires = new Date(jwtToken.exp * 1000)
    const timeout = expires.getTime() - Date.now() - (60 * 1000)
    refreshTokenTimeout = setTimeout(refreshTokenFn, timeout)
  }

  const stopRefreshTokenTimer = () => {
    clearTimeout(refreshTokenTimeout)
  }

  const refreshTokenFn = async () => {
    try {
      const response = await refreshToken()
      token.value = response.data.token
      localStorage.setItem('token', token.value)
      startRefreshTokenTimer()
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
    }
  }

  // Initialize the auth state
  const initAuth = () => {
    debugger
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      token.value = storedToken
      startRefreshTokenTimer()
    }
  }

  return { user, token, isAuthenticated, loginUser, registerUser, logout, updateProfile, initAuth }
})