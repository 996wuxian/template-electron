import { is } from '@electron-toolkit/utils'
import { BrowserWindow, ipcMain, IpcMainInvokeEvent, screen } from 'electron'
import { join } from 'path'

let isDragging = false
let startPosition = { x: 0, y: 0 }
let floatingWindow: BrowserWindow | null = null // 全局悬浮窗引用

export function setupIpcMainHandlers(mainWindow: BrowserWindow | null): void {
  // 窗口拖拽控制
  ipcMain.handle('start-drag', (_, mousePosition) => {
    isDragging = true
    const winPosition = mainWindow?.getPosition() || [0, 0]
    startPosition = {
      x: mousePosition.x - winPosition[0],
      y: mousePosition.y - winPosition[1]
    }
  })

  ipcMain.handle('end-drag', () => {
    isDragging = false
  })

  ipcMain.handle('window-drag', (_, mousePosition) => {
    if (isDragging && mainWindow) {
      const x = mousePosition.x - startPosition.x
      const y = mousePosition.y - startPosition.y
      mainWindow.setPosition(x, y)
    }
  })

  // 隐藏主窗口
  ipcMain.handle('hide-main-window', () => {
    if (mainWindow) {
      mainWindow.hide()
    }
  })

  // 获取当前窗口所在的显示器信息
  ipcMain.handle('get-current-display', (event: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      const winBounds = win.getBounds()
      const currentDisplay = screen.getDisplayMatching(winBounds)
      return currentDisplay
    }
    return null
  })

  // 设置窗口大小
  ipcMain.handle('set-window-size', (event, { width, height, center }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      // 取消最大化状态
      if (win.isMaximized()) {
        win.unmaximize()
      }

      // 获取当前显示器的缩放比例
      const currentDisplay = screen.getDisplayMatching(win.getBounds())

      // 设置实际物理像素大小
      win.setSize(Math.round(width), Math.round(height))

      // 如果需要居中，将窗口居中
      if (center && currentDisplay) {
        const { width: screenWidth, height: screenHeight } = currentDisplay.workAreaSize
        const { x: screenX, y: screenY } = currentDisplay.bounds
        const x = Math.round(screenX + (screenWidth - width) / 2)
        const y = Math.round(screenY + (screenHeight - height) / 2)
        win.setPosition(x, y)
      }
    }
  })

  // 设置窗口位置
  ipcMain.handle('set-window-position', (event, { x, y }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      // 禁用窗口缩放
      win.setResizable(false) // 禁止调整窗口大小
      win.setMaximizable(false) // 禁止最大化
      win.setFullScreenable(false) // 禁止全屏
      win.setMinimumSize(300, 300) // 设置最小尺寸
      win.setMaximumSize(300, 300) // 设置最大尺寸

      // 设置窗口位置
      win.setPosition(x - 50, y + 50)
    }
  })

  // 恢复窗口位置
  ipcMain.handle('restore-window-position', (event, { x, y }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      // 取消最大化状态
      if (win.isMaximized()) {
        win.unmaximize()
      }
      // 恢复窗口位置
      win.setResizable(true)
      win.setMaximizable(true)
      win.setFullScreenable(true)

      win.setPosition(Math.round(x), Math.round(y))
    }
  })

  // 固定窗口
  ipcMain.handle('fix-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      // 禁止调整窗口大小
      win.setResizable(false)

      // 禁止拖拽窗口
      win.setMovable(false)

      // 禁止最大化
      win.setMaximizable(false)

      // 禁止全屏
      win.setFullScreenable(false)

      // 设置窗口置顶
      win.setAlwaysOnTop(true)

      // 设置窗口半透明
      win.setOpacity(0.8) // 透明度为 0.8（范围：0 完全透明，1 完全不透明）
    }
  })

  // 恢复窗口
  ipcMain.handle('unfix-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      // 允许调整窗口大小
      win.setResizable(true)

      // 允许拖拽窗口
      win.setMovable(true)

      // 允许最大化
      win.setMaximizable(true)

      // 允许全屏
      win.setFullScreenable(true)

      // 取消窗口置顶
      win.setAlwaysOnTop(false)

      // 恢复窗口不透明
      win.setOpacity(1) // 恢复为完全不透明
    }
  })

  // 最大化窗口
  ipcMain.handle('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  // 最小化窗口
  ipcMain.handle('minimize-window', () => {
    mainWindow?.minimize()
  })

  // 关闭窗口
  ipcMain.handle('close-window', () => {
    mainWindow?.close()
  })

  // 切换悬浮窗
  ipcMain.handle('toggle-floating-window', () => {
    createFloatingWindow(mainWindow)
  })

  // 获取悬浮窗位置
  ipcMain.handle('get-position', (event: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      return win.getPosition()
    }
    return [0, 0]
  })

  // 设置悬浮窗位置
  ipcMain.handle('set-position', (event, { x, y }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      win.setPosition(x, y)
    }
  })

  // 显示主窗口
  ipcMain.handle('show-main-window', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })

  // 销毁悬浮窗
  ipcMain.handle('destroy-floating-window', () => {
    if (floatingWindow && !floatingWindow.isDestroyed()) {
      floatingWindow.destroy() // 完全销毁悬浮窗
      floatingWindow = null // 将引用置为 null
    }
  })

  // 固定窗口并设置半透明
  ipcMain.handle('set-window-pin', (event, isPinned) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (isPinned) {
        win.setMovable(false) // 禁止拖拽
        win.setOpacity(0.8) // 设置窗口半透明
      } else {
        win.setMovable(true) // 允许拖拽
        win.setOpacity(1) // 恢复窗口不透明
      }
    }
  })
}

function createFloatingWindow(mainWindow: BrowserWindow | null): BrowserWindow | null {
  // 如果悬浮窗已经存在，则直接返回现有的悬浮窗
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.show() // 确保悬浮窗是可见的
    return floatingWindow
  }

  // 获取主窗口所在的显示器

  // 使用 screen.getDisplayMatching(mainWindow.getBounds()) 获取主窗口所在的显示器。

  // 如果主窗口不存在，则使用 screen.getPrimaryDisplay() 获取主显示器。

  // 通过 screen.getAllDisplays() 可以获取所有显示器的信息，但在这里我们只需要主窗口所在的显示器。
  const currentDisplay = mainWindow
    ? screen.getDisplayMatching(mainWindow.getBounds())
    : screen.getPrimaryDisplay()

  // 创建新的悬浮窗
  floatingWindow = new BrowserWindow({
    width: 300,
    height: 300,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    frame: false,
    transparent: true
  })

  // 设置悬浮窗位置到当前显示器的右下角
  // 使用 currentDisplay.bounds 获取当前显示器的位置和大小。
  const { width: screenWidth, height: screenHeight } = currentDisplay.workAreaSize
  const { x: screenX, y: screenY } = currentDisplay.bounds
  floatingWindow.setPosition(screenX + screenWidth - 280, screenY + screenHeight - 280)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    floatingWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#/floating`)
  } else {
    floatingWindow.loadFile(join(__dirname, '../renderer/src/views/floating/index.vue'), {
      hash: 'floating'
    })
  }

  floatingWindow.on('closed', () => {
    floatingWindow = null // 悬浮窗关闭后，将引用置为 null
    if (mainWindow) {
      mainWindow.show()
    }
  })

  return floatingWindow
}
