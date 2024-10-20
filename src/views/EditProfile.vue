<template>
  <div class="container mx-auto px-4 py-8">
    <h2 class="text-2xl font-semibold mb-6">Edit Profile</h2>
    <form @submit.prevent="updateProfile" class="max-w-lg mx-auto">
      <div class="mb-4">
        <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
        <input v-model="profile.name" id="name" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
      </div>
      <div class="mb-4">
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input v-model="profile.email" id="email" type="email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
      </div>
      <div class="mb-4">
        <label for="country" class="block text-sm font-medium text-gray-700">Country</label>
        <select v-model="profile.country" id="country" @change="updateTimezones" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
          <option v-for="country in countries" :key="country.code" :value="country.name">{{ country.name }}</option>
        </select>
      </div>
      <div class="mb-4">
        <label for="timezone" class="block text-sm font-medium text-gray-700">Timezone</label>
        <select v-model="profile.timezone" id="timezone" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
          <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
        </select>
      </div>
      <div class="mb-4">
        <label for="nativeLanguage" class="block text-sm font-medium text-gray-700">Native Language</label>
        <select v-model="profile.nativeLanguage" id="nativeLanguage" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
          <option v-for="lang in languages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
        </select>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700">Learning Languages</label>
        <div v-for="(lang, index) in profile.learningLanguages" :key="index" class="mt-2 flex items-center">
          <select v-model="lang.language" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            <option value="">Select a language</option>
            <option v-for="l in languages" :key="l.code" :value="l.code">{{ l.name }}</option>
          </select>
          <select v-model="lang.level" class="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <button @click.prevent="addLearningLanguage" class="mt-2 px-4 py-2 bg-green-500 text-white rounded-md">Add Language</button>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700">Availability</label>
        <div v-for="(slot, index) in profile.availability" :key="index" class="flex space-x-2 mt-2">
          <select v-model="slot.day" class="mt-1 block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
          <input v-model="slot.startTime" type="time" class="mt-1 block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
          <input v-model="slot.endTime" type="time" class="mt-1 block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
          <button @click.prevent="removeAvailability(index)" class="mt-1 px-2 py-1 bg-red-500 text-white rounded-md">Remove</button>
        </div>
        <button @click.prevent="addAvailability" class="mt-2 px-4 py-2 bg-green-500 text-white rounded-md">Add Availability</button>
      </div>
      <div class="mb-4">
        <label for="allowRandomCalls" class="flex items-center">
          <input v-model="profile.allowRandomCalls" id="allowRandomCalls" type="checkbox" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
          <span class="ml-2 text-sm text-gray-600">Allow Random Calls</span>
        </label>
      </div>
      <div class="mt-6">
        <button type="submit" class="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Update Profile
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useToastStore } from '../stores/toastStore'
import countriesData from '../data/countries.json'
import languagesData from '../data/languages.json'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const countries = ref(countriesData)
const languages = ref(languagesData)
const timezones = ref([])

const profile = ref({
  id: '',
  name: '',
  email: '',
  country: '',
  timezone: '',
  nativeLanguage: '',
  learningLanguages: [],
  availability: [],
  allowRandomCalls: false
})

const loadUserProfile = async () => {
  try {
    const userData = await authStore.fetchUserProfile()
    debugger
    profile.value = { 
      ...userData,
      learningLanguages: userData.learningLanguages || [],
      availability: userData.availability || [],
      allowRandomCalls: userData.allowRandomCalls || false
    }
    updateTimezones()
  } catch (error) {
    console.error('Error loading user profile:', error)
    toastStore.showToast('Failed to load user profile', 'error')
    router.push('/login')
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    loadUserProfile()
  } else {
    router.push('/login')
  }
})



const updateTimezones = () => {
  const selectedCountry = countries.value.find(c => c.name === profile.value.country)
  if (selectedCountry) {
    timezones.value = selectedCountry.timezones
    if (!timezones.value.includes(profile.value.timezone)) {
      profile.value.timezone = timezones.value[0]
    }
  }
}

const addLearningLanguage = () => {
  profile.value.learningLanguages.push({ language: '', level: 'Beginner' })
}

const removeLearningLanguage = (index: number) => {
  profile.value.learningLanguages.splice(index, 1)
}

const addAvailability = () => {
  profile.value.availability.push({ day: 'Monday', startTime: '09:00', endTime: '17:00' })
}

const removeAvailability = (index: number) => {
  profile.value.availability.splice(index, 1)
}

const updateProfile = async () => {
  try {
    console.log('Updating profile with:', profile.value);
    const updatedProfile = await authStore.updateProfile(profile.value)
    if (updatedProfile) {
      console.log('Profile updated successfully:', updatedProfile)
      toastStore.showToast('Profile updated successfully', 'success')
      router.push('/')
    }
  } catch (error) {
    console.error('Failed to update profile:', error)
    toastStore.showToast('Failed to update profile', 'error')
  }
}
</script>