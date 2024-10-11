<template>
  <span class="inline-block w-3 h-3 rounded-full" :class="statusColor" :title="statusText"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UserStatus } from '../stores/userStore'

const { t } = useI18n()

const props = defineProps<{
  status: UserStatus
}>()

const statusColor = computed(() => {
  switch (props.status) {
    case 'online':
      return 'bg-green-500'
    case 'idle':
      return 'bg-yellow-500'
    case 'offline':
      return 'bg-gray-500'
    case 'hidden':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
})

const statusText = computed(() => {
  if(!props.status) return ''
  return t(props.status)
})
</script>