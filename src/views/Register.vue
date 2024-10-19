<template>
  <div class="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Create your account
      </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form class="space-y-6" @submit.prevent="register">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
            <input v-model="name" id="name" type="text" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
            <input v-model="email" id="email" type="email" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <input v-model="password" id="password" type="password" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
          </div>

          <div>
            <label for="country" class="block text-sm font-medium text-gray-700">Country</label>
            <select v-model="country" id="country" required @change="updateTimezones" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option v-for="c in countries" :key="c.name" :value="c.name">{{ c.name }}</option>
            </select>
          </div>

          <div>
            <label for="timezone" class="block text-sm font-medium text-gray-700">Timezone</label>
            <select v-model="timezone" id="timezone" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
            </select>
          </div>

          <div>
            <label for="nativeLanguage" class="block text-sm font-medium text-gray-700">Native Language</label>
            <select v-model="nativeLanguage" id="nativeLanguage" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option v-for="lang in languages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Learning Languages</label>
            <div v-for="(lang, index) in learningLanguages" :key="index" class="mt-2 flex items-center">
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
            <button type="button" @click="addLearningLanguage" class="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Add Language
            </button>
          </div>

          <div class="flex items-center">
            <input id="terms" name="terms" type="checkbox" v-model="acceptTerms" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
            <label for="terms" class="ml-2 block text-sm text-gray-900">
              I accept the <router-link to="/terms" class="text-indigo-600 hover:text-indigo-500">Terms and Conditions</router-link>
            </label>
          </div>

          <div>
            <button type="submit" :disabled="!acceptTerms" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
              Register
            </button>
          </div>
        </form>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">
                Or
              </span>
            </div>
          </div>

          <div class="mt-6">
            <router-link to="/login" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50">
              Sign in
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import countriesData from '../data/countries.json'
import languagesData from '../data/languages.json'
import { useReCaptcha } from 'vue-recaptcha-v3'

const router = useRouter()
const authStore = useAuthStore()
const { executeRecaptcha, recaptchaLoaded } = useReCaptcha()

const name = ref('')
const email = ref('')
const password = ref('')
const country = ref('')
const timezone = ref('')
const nativeLanguage = ref('')
const learningLanguages = ref([{ language: '', level: '' }])
const acceptTerms = ref(false)

const countries = ref(countriesData)
const languages = ref(languagesData)
const timezones = ref([])

const updateTimezones = () => {
  const selectedCountry = countries.value.find(c => c.name === country.value)
  if (selectedCountry) {
    timezones.value = selectedCountry.timezones
    timezone.value = selectedCountry.timezones[0]
  }
}

const addLearningLanguage = () => {
  learningLanguages.value.push({ language: '', level: '' })
}

const register = async () => {
  if (!acceptTerms.value) {
    alert('You must accept the Terms and Conditions to register.')
    return
  }

  try {
    await recaptchaLoaded()
    const token = await executeRecaptcha('register')
    
    // Here you would typically send the token to your server for verification
    console.log('reCAPTCHA token:', token)

    // Proceed with registration
    await authStore.registerUser({
      name: name.value,
      email: email.value,
      password: password.value,
      country: country.value,
      timezone: timezone.value,
      nativeLanguage: nativeLanguage.value,
      learningLanguages: learningLanguages.value.filter(lang => lang.language && lang.level),
      availability: []
    })
    router.push('/login')
  } catch (error) {
    console.error('Registration failed:', error)
    // Handle registration error (show message to user)
  }
}
</script>