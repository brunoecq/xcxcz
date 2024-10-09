<template>
  <div class="bg-white p-4 rounded shadow">
    <h3 class="text-lg font-semibold mb-2">User Actions</h3>
    <div class="space-y-2">
      <button @click="reportUser" class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
        Report User
      </button>
      <button @click="toggleBlock" class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white" :class="isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'">
        {{ isBlocked ? 'Unblock User' : 'Block User' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/userStore'

const props = defineProps<{
  userId: number
}>()

const userStore = useUserStore()
const isBlocked = ref(false)

onMounted(() => {
  isBlocked.value = userStore.blockedUsers.includes(props.userId)
})

const reportUser = () => {
  const reason = prompt('Please provide a reason for reporting this user:')
  if (reason) {
    userStore.reportUser(userStore.getCurrentUserId(), props.userId, reason)
  }
}

const toggleBlock = () => {
  if (isBlocked.value) {
    userStore.unblockUser(props.userId)
  } else {
    userStore.blockUser(props.userId)
  }
  isBlocked.value = !isBlocked.value
}
</script>