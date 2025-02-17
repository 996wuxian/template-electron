import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      sendMessage: (channel: string, data: any) => void
      onMessage: (channel: string, callback: (event: any, data: any) => void) => void
    }
  }
}
