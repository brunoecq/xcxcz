import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import UserList from '../views/UserList.vue'
import RoomList from '../views/RoomList.vue'
import CreateUser from '../views/CreateUser.vue'
import ChatRoom from '../views/ChatRoom.vue'
import UserChat from '../views/UserChat.vue'
import ChatList from '../views/ChatList.vue'
import VideoCall from '../views/VideoCall.vue'
import EditProfile from '../views/EditProfile.vue'
import Terms from '../views/Terms.vue'
import PrivacyPolicy from '../views/PrivacyPolicy.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/users',
    name: 'UserList',
    component: UserList
  },
  {
    path: '/rooms',
    name: 'RoomList',
    component: RoomList
  },
  {
    path: '/create-user',
    name: 'CreateUser',
    component: CreateUser
  },
  {
    path: '/chat/room/:roomId',
    name: 'ChatRoom',
    component: ChatRoom
  },
  {
    path: '/chat/user/:userId',
    name: 'UserChat',
    component: UserChat
  },
  {
    path: '/chats',
    name: 'ChatList',
    component: ChatList
  },
  {
    path: '/video-call/:userId',
    name: 'VideoCall',
    component: VideoCall
  },
  {
    path: '/edit-profile',
    name: 'EditProfile',
    component: EditProfile
  },
  {
    path: '/terms',
    name: 'Terms',
    component: Terms
  },
  {
    path: '/privacy-policy',
    name: 'PrivacyPolicy',
    component: PrivacyPolicy
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
