import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'

export function setupUpdate(mainWindow: BrowserWindow) {
  // 检查更新
  autoUpdater.autoDownload = true

  // 检测下载进度
  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow.webContents.send('update-progress', {
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond
    })
  })

  // 更新下载完成
  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded')
  })

  // 检测到新版本
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info)
  })

  // 没有新版本
  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update-not-available')
  })

  // 检查更新出错
  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-error', err)
  })

  // 开始检查更新
  autoUpdater.checkForUpdates()
}
