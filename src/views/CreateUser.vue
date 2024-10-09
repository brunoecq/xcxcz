<template>
  <div class="bg-white shadow-md rounded-lg p-6">
    <h1 class="text-2xl font-bold mb-6">Create User</h1>
    <form @submit.prevent="createUser" class="space-y-4">
      <div>
        <label for="username" class="block mb-1 font-medium">Username</label>
        <input v-model="userData.name" id="username" type="text" required class="w-full p-2 border rounded-md">
      </div>
      <div>
        <label for="email" class="block mb-1 font-medium">Email</label>
        <input v-model="userData.email" id="email" type="email" required class="w-full p-2 border rounded-md">
      </div>
      <div>
        <label for="country" class="block mb-1 font-medium">Country</label>
        <select v-model="userData.country" id="country" required class="w-full p-2 border rounded-md" @change="updateTimezone">
          <option v-for="country in countries" :key="country.code" :value="country.name">{{ country.name }}</option>
        </select>
      </div>
      <div>
        <label for="timezone" class="block mb-1 font-medium">Timezone</label>
        <select v-model="userData.timezone" id="timezone" required class="w-full p-2 border rounded-md">
          <option v-for="timezone in timezones" :key="timezone" :value="timezone">{{ timezone }}</option>
        </select>
      </div>
      <div>
        <label for="nativeLanguage" class="block mb-1 font-medium">Native Language</label>
        <select v-model="userData.nativeLanguage.name" id="nativeLanguage" required class="w-full p-2 border rounded-md">
          <option v-for="language in languages" :key="language.code" :value="language.name">{{ language.name }}</option>
        </select>
      </div>
      <div>
        <h3 class="font-medium mb-2">Learning Languages</h3>
        <div v-for="(lang, index) in userData.learningLanguages" :key="index" class="flex space-x-2 mb-2">
          <select v-model="lang.name" class="flex-grow p-2 border rounded-md">
            <option value="">Select a language</option>
            <option v-for="language in languages" :key="language.code" :value="language.name">{{ language.name }}</option>
          </select>
          <select v-model="lang.level" class="w-1/3 p-2 border rounded-md">
            <option value="">Select level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Fluent">Fluent</option>
          </select>
        </div>
        <button type="button" @click="addLearningLanguage" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300">Add Language</button>
      </div>
      <button type="submit" class="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300">Create User</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../stores/userStore'
import { useRouter } from 'vue-router'
import countriesData from '../data/countries.json'
import languagesData from '../data/languages.json'

const userStore = useUserStore()
const router = useRouter()

const countries = ref(countriesData)
const languages = ref(languagesData)
const timezones = ref([])

const userData = ref({
  name: '',
  email: '',
  avatar: 'https://i.pravatar.cc/150',
  nativeLanguage: { code: '', name: '' },
  learningLanguages: [{ code: '', name: '', level: '' }],
  country: '',
  timezone: ''
})

const updateTimezone = () => {
  const selectedCountry = countries.value.find(c => c.name === userData.value.country)
  if (selectedCountry) {
    timezones.value = selectedCountry.timezones
    userData.value.timezone = selectedCountry.timezones[0]
  }
}

const addLearningLanguage = () => {
  userData.value.learningLanguages.push({ code: '', name: '', level: '' })
}

const createUser = () => {
  userStore.createUser(userData.value)
  router.push('/users')
}
</script>