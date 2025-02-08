import { is } from '@electron-toolkit/utils'
import { BrowserWindow, ipcMain, IpcMainInvokeEvent, screen } from 'electron'
import { join } from 'path'

let floatingWindow: BrowserWindow | null = null // 全局悬浮窗引用
let originalBounds: Electron.Rectangle | null = null
let oldSize: Electron.Rectangle | null = null
let isMinimizing = false

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}
export function setupIpcMainHandlers(mainWindow: BrowserWindow | null): void {
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
      disableWindowResizingAndDragging(win, false)

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

  // 禁止调整窗口大小和禁止拖拽窗口
  const disableWindowResizingAndDragging = (win, bool) => {
    // 禁止调整窗口大小
    win.setResizable(bool)

    // 禁止拖拽窗口
    win.setMovable(bool)
  }

  ipcMain.handle('set-window-draggable', (event, bool) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      disableWindowResizingAndDragging(win, bool)
    }
  })

  // 恢复窗口
  ipcMain.handle('unfix-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      disableWindowResizingAndDragging(win, true)

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
    mainWindow?.maximize() // 如果窗口是正常状态，则最大化
  })

  // 获取窗口大小
  ipcMain.handle('get-window-size', () => {
    const [width, height] = mainWindow!.getSize()
    return { width, height }
  })

  // 最小化动画
  ipcMain.handle('toggle-minimize-animation', async () => {
    isMinimizing = true
    changeMinimizeAnimation()
  })

  const changeMinimizeAnimation = async () => {
    const currentWindow = mainWindow!
    const currentBounds = currentWindow.getBounds()

    // 获取窗口所在的显示器
    const currentScreen = screen.getDisplayNearestPoint({
      x: currentBounds.x,
      y: currentBounds.y
    })
    if (isMinimizing) {
      originalBounds = currentBounds!
      oldSize = currentBounds!
    }

    // 使用当前显示器的尺寸
    const { workArea } = currentScreen
    const targetX = workArea.x + (workArea.width - 10) / 2 // 基于当前显示器的工作区
    const targetY = workArea.y + workArea.height - 30 // 留出任务栏空间

    const steps = 20
    const duration = 100

    for (let i = 0; i <= steps; i++) {
      const progress = isMinimizing ? easeInOutQuad(i / steps) : 1 - easeInOutQuad(i / steps)

      const newWidth = originalBounds!.width - (originalBounds!.width - 10) * progress
      const newHeight = originalBounds!.height - (originalBounds!.height - 10) * progress
      const newX = originalBounds!.x + (targetX - originalBounds!.x) * progress
      const newY = originalBounds!.y + (targetY - originalBounds!.y) * progress

      mainWindow?.setBounds({
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(Math.max(newWidth, 10)),
        height: Math.round(Math.max(newHeight, 10))
      })

      await new Promise((resolve) => setTimeout(resolve, duration / steps))
    }

    if (isMinimizing) {
      currentWindow.minimize()
    } else {
      currentWindow.setBounds(oldSize!)
    }
  }

  // 监听窗口恢复事件
  mainWindow?.on('restore', () => {
    isMinimizing = false
    changeMinimizeAnimation()
  })

  mainWindow?.on('minimize', () => {
    if (isMinimizing) return
    isMinimizing = true
    changeMinimizeAnimation()
  })

  // 关闭窗口
  ipcMain.handle('close-window', () => {
    mainWindow?.close()
  })

  // 窗口缩放动画
  ipcMain.handle(
    'animate-window',
    async (event, { targetX, targetY, targetWidth, targetHeight, step }) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) return

      const {
        x: initialX,
        y: initialY,
        width: initialWidth,
        height: initialHeight
      } = win.getBounds()
      const steps = step
      const stepX = (targetX - initialX) / steps
      const stepY = (targetY - initialY) / steps
      const stepWidth = (targetWidth - initialWidth) / steps
      const stepHeight = (targetHeight - initialHeight) / steps

      let currentStep = 0
      const interval = setInterval(() => {
        if (currentStep >= steps) {
          clearInterval(interval) // 停止动画
        } else {
          currentStep++
          const newX = initialX + stepX * currentStep
          const newY = initialY + stepY * currentStep
          const newWidth = initialWidth + stepWidth * currentStep
          const newHeight = initialHeight + stepHeight * currentStep

          // 更新窗口位置和大小
          win.setBounds({
            x: Math.round(newX),
            y: Math.round(newY),
            width: Math.round(newWidth),
            height: Math.round(newHeight)
          })
        }
      }, 10) // 每10ms更新一次
    }
  )

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

// 创建悬浮窗窗口
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
