import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';
import { i18n } from './i18n';
import { VueReCaptcha } from 'vue-recaptcha-v3';
import { useAuthStore } from './stores/authStore';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(VueReCaptcha, {
  siteKey: '6Lekm1kqAAAAAJ9wig5r_T-qWe3Jo71vI-VpQC19',
});
app.use(router);
app.use(i18n);

// Initialize auth state before mounting the app
const authStore = useAuthStore();
authStore.initAuth();

app.mount('#app');