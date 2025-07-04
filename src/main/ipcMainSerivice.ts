import { is } from '@electron-toolkit/utils'
import { BrowserWindow, ipcMain, IpcMainInvokeEvent, screen, dialog, app } from 'electron'
import { autoUpdater } from 'electron-updater'
import { join } from 'path'
import axios from 'axios'
import * as fs from 'fs'
import * as XLSX from 'xlsx'
import {
  setMainWindow,
  setTodoReminder,
  cancelTodoReminder,
  snoozeTodoReminder
} from './utils/notification'
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
      setMainWindow(mainWindow)
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

  // 固定窗口
  ipcMain.handle('no-fix-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      disableWindowResizingAndDragging(win, false)

      // 禁止最大化
      win.setMaximizable(false)

      // 禁止全屏
      win.setFullScreenable(false)

      // 设置窗口置顶
      // win.setAlwaysOnTop(true)

      // 设置窗口半透明
      win.setOpacity(0.8) // 透明度为 0.8（范围：0 完全透明，1 完全不透明）
    }
  })

  ipcMain.handle('check-update', async () => {
    try {
      // 获取 GitHub 最新发布版本信息
      const response = await axios.get(
        'https://api.github.com/repos/996wuxian/template-electron/releases/latest'
      )

      const latestVersion = response.data.tag_name.replace('v', '')
      const currentVersion = app.getVersion()

      // 比较版本号
      const hasUpdate = compareVersions(latestVersion, currentVersion) > 0

      return {
        hasUpdate,
        latestVersion,
        downloadUrl: hasUpdate ? response.data.html_url : null
      }
    } catch (error) {
      console.error('检查更新失败:', error)
      throw error
    }
  })

  // 版本号比较函数
  function compareVersions(v1: string, v2: string) {
    const v1Parts = v1.split('.').map(Number)
    const v2Parts = v2.split('.').map(Number)

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0

      if (v1Part > v2Part) return 1
      if (v1Part < v2Part) return -1
    }

    return 0
  }

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

  ipcMain.handle('set-todo-reminder', async (event, todoData) => {
    try {
      setTodoReminder(todoData)
      return { success: true }
    } catch (error) {
      console.error('设置提醒失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('cancel-todo-reminder', async (event, todoId) => {
    try {
      cancelTodoReminder(todoId)
      return { success: true }
    } catch (error) {
      console.error('取消提醒失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('snooze-todo-reminder', async (event, todoId, minutes) => {
    try {
      snoozeTodoReminder(todoId, minutes)
      return { success: true }
    } catch (error) {
      console.error('延迟提醒失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 完成待办
  ipcMain.handle('complete-todo', async (event, todoId) => {
    try {
      // 这里需要更新待办状态为已完成
      // 可以通过向主窗口发送消息来更新状态
      if (mainWindow) {
        mainWindow.webContents.send('complete-todo-from-reminder', todoId)
      }
      return { success: true }
    } catch (error) {
      console.error('完成待办失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 打开主窗口并定位到特定待办
  ipcMain.handle('open-main-window-with-todo', async (event, todoId) => {
    try {
      if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
        // 发送消息到渲染进程，让其定位到特定待办
        mainWindow.webContents.send('focus-todo', todoId)
      }
      return { success: true }
    } catch (error) {
      console.error('打开主窗口失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 导出数据功能
  ipcMain.handle('export-data', async (event, { data, type, format }) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) return { success: false, error: '窗口不存在' }

      // 显示保存对话框
      const result = await dialog.showSaveDialog(win, {
        title: `导出${type === 'today' ? '今日计划' : '历史待办'}`,
        defaultPath: `${type === 'today' ? '今日计划' : '历史待办'}_${new Date().toISOString().split('T')[0]}.${format}`,
        filters: [
          format === 'excel'
            ? { name: 'Excel文件', extensions: ['xlsx'] }
            : { name: '文本文件', extensions: ['txt'] }
        ]
      })

      if (result.canceled || !result.filePath) {
        return { success: false, error: '用户取消导出' }
      }

      // 根据格式导出数据
      if (format === 'excel') {
        await exportToExcel(data, result.filePath, type)
      } else {
        await exportToTxt(data, result.filePath, type)
      }

      return { success: true, filePath: result.filePath }
    } catch (error) {
      console.error('导出失败:', error)
      return { success: false, error: error.message }
    }
  })

  async function exportToExcel(data: any[], filePath: string, type: string) {
    const workbook = XLSX.utils.book_new()

    // 转换数据格式
    const excelData = data.map((item, index) => ({
      序号: index + 1,
      任务内容: item.text || '',
      描述: item.description || '',
      状态: getStatusText(item.status),
      完成状态: item.completed ? '已完成' : '未完成',
      创建时间: item.createdAt || '',
      完成时间: item.completedAt || '',
      优先级: item.level || 1,
      子任务数量: item.subTodos ? item.subTodos.length : 0
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // 设置列宽
    const colWidths = [
      { wch: 8 }, // 序号
      { wch: 30 }, // 任务内容
      { wch: 40 }, // 描述
      { wch: 12 }, // 状态
      { wch: 12 }, // 完成状态
      { wch: 20 }, // 创建时间
      { wch: 20 }, // 完成时间
      { wch: 10 }, // 优先级
      { wch: 12 } // 子任务数量
    ]
    worksheet['!cols'] = colWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, type === 'today' ? '今日计划' : '历史待办')
    XLSX.writeFile(workbook, filePath)
  }

  // 导出为TXT格式
  async function exportToTxt(data: any[], filePath: string, type: string) {
    let content = `${type === 'today' ? '今日计划' : '历史待办'}导出\n`
    content += `导出时间: ${new Date().toLocaleString()}\n`
    content += `总计: ${data.length} 项任务\n`
    content += '='.repeat(50) + '\n\n'

    data.forEach((item, index) => {
      content += `${index + 1}. ${item.text || ''}\n`
      if (item.description) {
        content += `   描述: ${item.description}\n`
      }
      content += `   状态: ${getStatusText(item.status)} | ${item.completed ? '已完成' : '未完成'}\n`
      content += `   创建时间: ${item.createdAt || ''}\n`
      if (item.completedAt) {
        content += `   完成时间: ${item.completedAt}\n`
      }
      content += `   优先级: ${item.level || 1}\n`

      if (item.subTodos && item.subTodos.length > 0) {
        content += `   子任务 (${item.subTodos.length}项):\n`
        item.subTodos.forEach((subTodo, subIndex) => {
          content += `     ${subIndex + 1}) ${subTodo.text || ''} [${subTodo.completed ? '已完成' : '未完成'}]\n`
        })
      }
      content += '\n' + '-'.repeat(30) + '\n\n'
    })

    fs.writeFileSync(filePath, content, 'utf8')
  }

  function getStatusText(status: number): string {
    switch (status) {
      case 1:
        return '待处理'
      case 2:
        return '进行中'
      case 3:
        return '已完成'
      case 4:
        return '已取消'
      default:
        return '未知状态'
    }
  }

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

  // 监听窗口大小变化并触发自定义方法
  mainWindow?.on('resize', () => {
    const [width, height] = mainWindow.getSize()
    // 向渲染进程发送 IPC 消息
    mainWindow.webContents.send('resize-detected', { width, height })
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

  ipcMain.handle('selectDirectory', () => {
    return dialog.showOpenDialog({
      properties: ['openDirectory']
    })
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
      mainWindow.webContents.send('main-window-show')
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

// 添加退出并安装更新的处理
ipcMain.on('quit-and-install', () => {
  autoUpdater.quitAndInstall()
})

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
    width: 150,
    height: 200,
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
    // 修改这里的加载路径
    floatingWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/floating' // 修改这里，去掉 src/views/floating/index.vue
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
