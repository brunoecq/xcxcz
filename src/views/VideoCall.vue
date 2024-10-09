<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <div class="flex-1 flex">
      <div class="flex-1 bg-black">
        <video ref="remoteVideo" autoplay class="w-full h-full object-cover"></video>
      </div>
      <div class="w-1/4 bg-gray-800">
        <video ref="localVideo" autoplay muted class="w-full h-full object-cover"></video>
      </div>
    </div>
    <div class="bg-gray-800 p-4 flex justify-center space-x-4">
      <button @click="toggleAudio" class="bg-white text-gray-800 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
        {{ isAudioEnabled ? 'Mute' : 'Unmute' }}
      </button>
      <button @click="toggleVideo" class="bg-white text-gray-800 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
        {{ isVideoEnabled ? 'Stop Video' : 'Start Video' }}
      </button>
      <button @click="endCall" class="bg-red-500 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
        End Call
      </button>
    </div>
  </div>

  <!-- Modal para llamada entrante -->
  <div v-if="showIncomingCallModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div class="bg-white p-6 rounded-lg">
      <h2 class="text-xl font-bold mb-4">Incoming call from {{ incomingCallFrom }}</h2>
      <div class="flex justify-center space-x-4">
        <button @click="acceptCall" class="bg-green-500 text-white px-4 py-2 rounded-md">Accept</button>
        <button @click="rejectCall" class="bg-red-500 text-white px-4 py-2 rounded-md">Reject</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Peer from 'simple-peer'
import { useUserStore } from '../stores/userStore'
import { useAuthStore } from '../stores/authStore'
import { socket } from '../api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()

const localVideo = ref<HTMLVideoElement | null>(null)
const remoteVideo = ref<HTMLVideoElement | null>(null)
const isAudioEnabled = ref(true)
const isVideoEnabled = ref(true)
const showIncomingCallModal = ref(false)
const incomingCallFrom = ref('')

let peer: Peer.Instance | null = null
let localStream: MediaStream | null = null

onMounted(async () => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    if (localVideo.value) {
      localVideo.value.srcObject = localStream
    }

    // Iniciar llamada si es el iniciador
    if (route.query.initiator === 'true') {
      startCall()
    } else {
      // Esperar llamada entrante
      listenForIncomingCall()
    }

  } catch (error) {
    console.error('Error accessing media devices:', error)
  }
})

onUnmounted(() => {
  if (peer) {
    peer.destroy()
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop())
  }
})

const startCall = () => {
  peer = new Peer({
    initiator: true,
    stream: localStream,
    trickle: false
  })

  peer.on('signal', (data) => {
    socket.emit('call user', {
      userToCall: route.params.userId,
      signalData: data,
      from: authStore.user.id
    })
  })

  peer.on('stream', (stream) => {
    if (remoteVideo.value) {
      remoteVideo.value.srcObject = stream
    }
  })

  socket.on('call accepted', (signal) => {
    peer.signal(signal)
  })
}

const listenForIncomingCall = () => {
  socket.on('hey', (data) => {
    incomingCallFrom.value = data.from
    showIncomingCallModal.value = true

    peer = new Peer({
      initiator: false,
      stream: localStream,
      trickle: false
    })

    peer.on('signal', (data) => {
      socket.emit('accept call', { signal: data, to: incomingCallFrom.value })
    })

    peer.on('stream', (stream) => {
      if (remoteVideo.value) {
        remoteVideo.value.srcObject = stream
      }
    })

    peer.signal(data.signal)
  })
}

const acceptCall = () => {
  showIncomingCallModal.value = false
  // La llamada ya está configurada, solo necesitamos ocultar el modal
}

const rejectCall = () => {
  showIncomingCallModal.value = false
  if (peer) {
    peer.destroy()
  }
  router.push('/users')
}

const toggleAudio = () => {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0]
    audioTrack.enabled = !audioTrack.enabled
    isAudioEnabled.value = audioTrack.enabled
  }
}

const toggleVideo = () => {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0]
    videoTrack.enabled = !videoTrack.enabled
    isVideoEnabled.value = videoTrack.enabled
  }
}

const endCall = () => {
  if (peer) {
    peer.destroy()
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop())
  }
  router.push('/users')
}
</script>