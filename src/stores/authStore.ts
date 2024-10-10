import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, updateProfile as apiUpdateProfile } from '../api'

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

  return { user, token, isAuthenticated, loginUser, registerUser, logout, updateProfile }
})