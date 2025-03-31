import { app, shell, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { setupIpcMainHandlers } from './ipcMainSerivice'
import { setupUpdate } from './update'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const iconPath = join(__dirname, '../../resources/icon.png')
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: iconPath,
    ...(process.platform === 'linux' ? { iconPath } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    frame: false,
    transparent: true
  })

  mainWindow.on('minimize', () => {
    if (process.platform === 'win32') {
      mainWindow?.webContents.setBackgroundThrottling(true)
    }
  })

  mainWindow.on('restore', () => {
    mainWindow?.webContents.setBackgroundThrottling(false)
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 获取应用版本号
  ipcMain.handle('get-version', () => {
    return app.getVersion()
  })

  ipcMain.handle('get-app-update', () => {
    setupUpdate(mainWindow)
  })

  // 设置 IPC 处理器
  setupIpcMainHandlers(mainWindow)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 添加托盘相关处理

let tray: Tray | null = null
const iconPath = join(__dirname, '../../resources/icon.png')
// 创建托盘
function createTray() {
  if (!tray) {
    tray = new Tray(iconPath) // 替换为你的托盘图标路径
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          mainWindow?.show()
        }
      },
      {
        label: '退出',
        click: () => {
          app.quit()
        }
      }
    ])
    tray.setToolTip('Todo')
    tray.setContextMenu(contextMenu)

    // 点击托盘图标显示主窗口
    tray.on('click', () => {
      mainWindow?.show()
    })
  }
}

// 添加隐藏到托盘的 IPC 处理
ipcMain.handle('hide-to-tray', () => {
  if (!tray) {
    createTray()
  }
  mainWindow?.hide()
})
