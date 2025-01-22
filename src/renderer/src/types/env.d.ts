declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'nprogress'

declare module 'tinycolor2'

interface Window {
  NProgress: any
  electron: {
    ipcRenderer: {
      invoke(channel: string, data?: any): Promise<any>
      // Add other ipcRenderer methods you're using
    }
  }
}

declare module 'mockjs'
declare module 'qs'
