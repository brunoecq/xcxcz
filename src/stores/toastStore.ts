import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) => {
    const id = Date.now()
    toasts.value.push({ id, message, type, duration })
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, showToast, removeToast }
})