import './assets/css/global.css'
import 'nprogress/nprogress.css'
import 'virtual:uno.css'
import 'animate.css'
import { createApp } from 'vue'
import App from './App.vue'
import store from './stores'
import { setupRouter } from './router'
import { setupNProgress } from './plugins'
import svgIcon from '@renderer/plugins/svg-icon'
import useSocketStore from '@renderer/stores/modules/socket'

const app = createApp(App)

// 关闭警告
app.config.warnHandler = () => null
async function setupApp() {
  await app.use(store)
  setupNProgress()
  app.use(svgIcon)
  setupRouter(app)

  const socketStore = useSocketStore()
  socketStore.initSocket()

  app.mount('#app')
}

setupApp()
