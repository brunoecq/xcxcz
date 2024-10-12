import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';
import { i18n } from './i18n';
import { VueReCaptcha } from 'vue-recaptcha-v3';

const app = createApp(App);
app.use(VueReCaptcha, {
  siteKey: '6Lekm1kqAAAAAJ9wig5r_T-qWe3Jo71vI-VpQC19',
});
app.use(createPinia());
app.use(router);
app.use(i18n);
app.mount('#app');
