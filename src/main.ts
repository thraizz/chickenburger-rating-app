import * as Sentry from '@sentry/vue';
import { createApp } from 'vue';
import App from './App.vue';

import { VueFire, VueFireAuth } from 'vuefire';
import { firebaseApp } from './firebase';
import router from './router';
import './style.css';

const app = createApp(App);

Sentry.init({
  app,
  dsn: 'https://bee2aac70d5dff7d224d7cbebd0bf219@o4504645960138752.ingest.us.sentry.io/4509102411022336',
});

app.use(router);

app.use(VueFire, {
  firebaseApp,
  modules: [
    VueFireAuth(),
  ],
});

app.mount('#app');
