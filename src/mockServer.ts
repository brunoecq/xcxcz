import { ref } from 'vue'

interface User {
  id: number;
  name: string;
  email: string;
  nativeLanguage: string;
  learningLanguages: { name: string; level: string }[];
  country: string;
  timezone: string;
  status: 'online' | 'idle' | 'offline' | 'hidden';
  allowRandomCalls: boolean;
  availability: string[];
}

interface Room {
  id: string;
  name: string;
  language: string;
  level: string;
  userCount: number;
}

interface Chat {
  id: number;
  otherUserId: number;
  name: string;
  lastMessage: string;
  lastMessageDate: string;
}

const users = ref<User[]>(Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  nativeLanguage: ['English', 'Spanish', 'French', 'German', 'Chinese'][Math.floor(Math.random() * 5)],
  learningLanguages: [
    { name: ['Spanish', 'French', 'German', 'Chinese', 'Japanese'][Math.floor(Math.random() * 5)], level: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)] }
  ],
  country: ['USA', 'Spain', 'France', 'Germany', 'China'][Math.floor(Math.random() * 5)],
  timezone: ['America/New_York', 'Europe/Madrid', 'Europe/Paris', 'Europe/Berlin', 'Asia/Shanghai'][Math.floor(Math.random() * 5)],
  status: ['online', 'idle', 'offline', 'hidden'][Math.floor(Math.random() * 4)] as 'online' | 'idle' | 'offline' | 'hidden',
  allowRandomCalls: Math.random() < 0.5,
  availability: ['Monday 9-5', 'Tuesday 10-6', 'Wednesday 9-5', 'Thursday 10-6', 'Friday 9-5'].slice(0, Math.floor(Math.random() * 5) + 1)
})))

const rooms = ref<Room[]>([
  {
    id: "1",
    name: "English Conversation",
    language: "English",
    level: "Intermediate",
    userCount: 15
  },
  {
    id: "2",
    name: "Spanish for Beginners",
    language: "Spanish",
    level: "Beginner",
    userCount: 8
  },
  {
    id: "3",
    name: "French Literature Discussion",
    language: "French",
    level: "Advanced",
    userCount: 6
  },
  {
    id: "4",
    name: "German Business Talk",
    language: "German",
    level: "Intermediate",
    userCount: 10
  },
  {
    id: "5",
    name: "Chinese Cultural Exchange",
    language: "Chinese",
    level: "All Levels",
    userCount: 12
  }
])

export const mockServer = {
  getUsers: (page: number = 1, limit: number = 10): User[] => {
    const start = (page - 1) * limit
    const end = start + limit
    return users.value.slice(start, end)
  },

  getRooms: (page: number = 1, limit: number = 10): Room[] => {
    const start = (page - 1) * limit
    const end = start + limit
    return rooms.value.slice(start, end)
  },

  getChats: (userId: number): Chat[] => {
    return [
      {
        id: 1,
        otherUserId: 2,
        name: "Jane Smith",
        lastMessage: "Hello!",
        lastMessageDate: new Date().toISOString()
      },
      {
        id: 2,
        otherUserId: 3,
        name: "Bob Johnson",
        lastMessage: "How are you?",
        lastMessageDate: new Date().toISOString()
      }
    ];
  },

  login: (email: string, password: string) => {
    const user = users.value.find(u => u.email === email);
    if (user && password === 'password') { // Simplified password check
      return {
        token: 'mock_token',
        user: { ...user, password: undefined }
      };
    }
    throw new Error('Invalid credentials');
  },

  register: (userData: Omit<User, 'id'>) => {
    const newUser = {
      id: users.value.length + 1,
      ...userData,
      status: 'online' as const
    };
    users.value.push(newUser);
    return { ...newUser, password: undefined };
  },

  getMessages: (roomId: string) => {
    // Mock messages for the room
    return [
      { id: 1, senderId: 1, text: 'Hello!', createdAt: new Date().toISOString() },
      { id: 2, senderId: 2, text: 'Hi there!', createdAt: new Date().toISOString() },
      { id: 3, senderId: 1, text: 'How are you?', createdAt: new Date().toISOString() },
    ];
  },

  sendMessage: (senderId: number, receiverId: number, roomId: string | null, text: string) => {
    const newMessage = {
      id: Math.floor(Math.random() * 1000000),
      senderId,
      receiverId,
      roomId,
      text,
      createdAt: new Date().toISOString()
    };
    return newMessage;
  },

  createRoom: (roomData: Omit<Room, 'id' | 'userCount'>) => {
    const newRoom = {
      id: (rooms.value.length + 1).toString(),
      ...roomData,
      userCount: 1
    };
    rooms.value.push(newRoom);
    return newRoom;
  },

  joinRoom: (roomId: string, userId: number) => {
    const room = rooms.value.find(r => r.id === roomId);
    if (room) {
      room.userCount += 1;
    }
    return room;
  },

  leaveRoom: (roomId: string, userId: number) => {
    const room = rooms.value.find(r => r.id === roomId);
    if (room && room.userCount > 0) {
      room.userCount -= 1;
    }
    return room;
  },

  updateProfile: (profileData: Partial<User>) => {
    const userIndex = users.value.findIndex(u => u.id === profileData.id);
    if (userIndex !== -1) {
      users.value[userIndex] = { ...users.value[userIndex], ...profileData };
      return users.value[userIndex];
    }
    throw new Error('User not found');
  },

  updateUserStatus: (userId: number, status: 'online' | 'idle' | 'offline' | 'hidden') => {
    const userIndex = users.value.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users.value[userIndex].status = status;
      return users.value[userIndex];
    }
    throw new Error('User not found');
  }
}