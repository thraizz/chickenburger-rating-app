import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';

import { VueFire, VueFireAuth } from 'vuefire';
import { firebaseApp } from './firebase';
import router from './router';
import './style.css';

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

app.use(router);

app.use(VueFire, {
  firebaseApp,
  modules: [VueFireAuth()],
});

app.mount('#app');
