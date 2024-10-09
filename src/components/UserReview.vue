<template>
  <div class="bg-white p-4 rounded shadow">
    <h3 class="text-lg font-semibold mb-2">Leave a Review</h3>
    <form @submit.prevent="submitReview">
      <div class="mb-4">
        <label for="rating" class="block text-sm font-medium text-gray-700">Rating</label>
        <select v-model="rating" id="rating" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
          <option v-for="i in 5" :key="i" :value="i">{{ i }} stars</option>
        </select>
      </div>
      <div class="mb-4">
        <label for="comment" class="block text-sm font-medium text-gray-700">Comment</label>
        <textarea v-model="comment" id="comment" rows="3" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"></textarea>
      </div>
      <button type="submit" class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Submit Review
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../stores/userStore'

const props = defineProps<{
  userId: number
}>()

const userStore = useUserStore()
const rating = ref(5)
const comment = ref('')

const submitReview = () => {
  userStore.addReview(props.userId, {
    reviewerId: userStore.getCurrentUserId(),
    rating: rating.value,
    comment: comment.value
  })
  rating.value = 5
  comment.value = ''
}
</script>