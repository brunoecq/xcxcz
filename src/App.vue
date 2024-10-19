<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-indigo-600 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <router-link to="/" class="text-white font-bold text-xl">Language Chat</router-link>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8 content-center flex-wrap">
              <router-link to="/users" class="text-gray-300 hover:bg-indigo-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">{{ $t('users') }}</router-link>
              <router-link to="/rooms" class="text-gray-300 hover:bg-indigo-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">{{ $t('rooms') }}</router-link>
              <router-link to="/chats" class="text-gray-300 hover:bg-indigo-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">{{ $t('myChats') }}</router-link>
            </div>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:items-center">
            <select v-model="$i18n.locale" class="bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
            </select>
            <NotificationCenter />
            <div class="ml-3 relative">
              <div v-if="isLoggedIn">
                <button @click="toggleDropdown" class="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white">
                  <img class="h-8 w-8 rounded-full" :src="userAvatar" alt="">
                </button>
              </div>
              <div v-else>
                <router-link to="/login" class="text-gray-300 hover:bg-indigo-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">{{ $t('login') }}</router-link>
                <router-link to="/register" class="text-gray-300 hover:bg-indigo-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">{{ $t('register') }}</router-link>
              </div>
              <div v-if="showDropdown" class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <router-link to="/edit-profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{{ $t('editProfile') }}</router-link>
                <a @click="logout" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">{{ $t('logout') }}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <main>
      <router-view></router-view>
    </main>

    <footer class="bg-gray-800 text-white py-4">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center">
          <p>&copy; 2023 Language Chat. {{ $t('allRightsReserved') }}.</p>
          <div>
            <router-link to="/terms" class="text-gray-300 hover:text-white mr-4">{{ $t('termsAndConditions') }}</router-link>
            <router-link to="/privacy-policy" class="text-gray-300 hover:text-white">{{ $t('privacyPolicy') }}</router-link>
          </div>
        </div>
      </div>
    </footer>

    <ToastNotification />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/authStore'
import { useI18n } from 'vue-i18n'
import NotificationCenter from './components/NotificationCenter.vue'
import ToastNotification from './components/ToastNotification.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const showDropdown = ref(false)
const isLoggedIn = computed(() => !!authStore.user)
const userAvatar = computed(() => authStore.user?.avatar || 'https://i.pravatar.cc/150')

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>