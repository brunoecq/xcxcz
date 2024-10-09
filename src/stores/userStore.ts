import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUsers, submitReview, reportUser, blockUser, unblockUser } from '../api'

export type UserStatus = 'online' | 'idle' | 'offline' | 'hidden'

export interface User {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  nativeLanguage: string;
  learningLanguages: { name: string; level: string }[];
  country: string;
  timezone: string;
  allowRandomCalls: boolean;
  availability: string[];
  score: number;
  reviews: Review[];
}

export interface Review {
  id: number;
  reviewerId: number;
  rating: number;
  comment: string;
  createdAt: Date;
}

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const blockedUsers = ref<number[]>([])

  const fetchUsers = async (page: number = 1, limit: number = 10) => {
    try {
      const response = await getUsers(page, limit)
      users.value = response.data.map(user => ({
        ...user,
        status: user.status as UserStatus,
        score: 0,
        reviews: []
      }))
      return users.value
    } catch (error) {
      console.error('Error fetching users:', error)
      return []
    }
  }

  const updateUserStatus = (userId: number, status: UserStatus) => {
    const userIndex = users.value.findIndex(user => user.id === userId)
    if (userIndex !== -1) {
      users.value[userIndex].status = status
      // Aquí se debería implementar la actualización del estado en el servidor
    }
  }

  const findRandomUser = () => {
    const currentUser = users.value.find(user => user.id === getCurrentUserId())
    if (!currentUser) return null

    const availableUsers = users.value.filter(user => 
      user.id !== currentUser.id &&
      user.allowRandomCalls &&
      (user.nativeLanguage === currentUser.learningLanguages[0].name ||
       user.learningLanguages.some(lang => lang.name === currentUser.nativeLanguage)) &&
      !blockedUsers.value.includes(user.id)
    )

    if (availableUsers.length === 0) return null

    return availableUsers[Math.floor(Math.random() * availableUsers.length)]
  }

  const addReview = async (userId: number, review: Omit<Review, 'id' | 'createdAt'>) => {
    try {
      const response = await submitReview({ ...review, reviewedId: userId })
      const userIndex = users.value.findIndex(user => user.id === userId)
      if (userIndex !== -1) {
        users.value[userIndex].reviews.push(response.data)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    }
  }

  const incrementUserScore = (userId: number, points: number) => {
    const userIndex = users.value.findIndex(user => user.id === userId)
    if (userIndex !== -1) {
      users.value[userIndex].score += points
      // Aquí se debería implementar la actualización del puntaje en el servidor
    }
  }

  const reportUserAction = async (reporterId: number, reportedUserId: number, reason: string) => {
    try {
      await reportUser({ reporterId, reportedId: reportedUserId, reason })
      console.log(`User ${reporterId} reported user ${reportedUserId} for: ${reason}`)
    } catch (error) {
      console.error('Error reporting user:', error)
    }
  }

  const blockUserAction = async (userId: number) => {
    try {
      await blockUser({ blockerId: getCurrentUserId(), blockedId: userId })
      if (!blockedUsers.value.includes(userId)) {
        blockedUsers.value.push(userId)
      }
    } catch (error) {
      console.error('Error blocking user:', error)
    }
  }

  const unblockUserAction = async (userId: number) => {
    try {
      await unblockUser({ blockerId: getCurrentUserId(), blockedId: userId })
      blockedUsers.value = blockedUsers.value.filter(id => id !== userId)
    } catch (error) {
      console.error('Error unblocking user:', error)
    }
  }

  const getCurrentUserId = () => {
    // Esto debería obtener el ID del usuario actual del estado de autenticación
    const authStore = useAuthStore()
    return authStore.user?.id
  }

  return { 
    users, 
    fetchUsers, 
    updateUserStatus, 
    findRandomUser,
    addReview,
    incrementUserScore,
    reportUserAction,
    blockUserAction,
    unblockUserAction
  }
})