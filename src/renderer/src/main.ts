import './assets/css/global.css'
import 'nprogress/nprogress.css'
import 'virtual:uno.css'
import { createApp } from 'vue'
import App from './App.vue'
import store from './stores'
import { setupRouter } from './router'
import { setupNProgress } from './plugins'

const app = createApp(App)

// 关闭警告
app.config.warnHandler = () => null
async function setupApp() {
  await app.use(store)
  setupNProgress()
  setupRouter(app)
  app.mount('#app')
}

setupApp()
