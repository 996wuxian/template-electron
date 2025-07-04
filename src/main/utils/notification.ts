import { BrowserWindow, screen } from 'electron'
import { join } from 'path'

// 待办提醒窗口管理
const reminderWindows: BrowserWindow[] = []
const activeReminders = new Map<number, NodeJS.Timeout>()
const REMINDER_HEIGHT = 180
const REMINDER_GAP = 10

// 主窗口引用
let mainWindow: BrowserWindow | null = null

// 待办提醒通知模板
const todoReminderTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * {
      box-sizing: border-box;
    }

    html {
      background: transparent;
    }

    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: transparent;
      color: #333;
      overflow: hidden;
      position: relative;
      min-height: 160px;
    }

    .reminder-wrapper {
      background: linear-gradient(135deg,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(248, 250, 252, 0.95) 100%);
      border-radius: 8px;
      backdrop-filter: blur(10px);
      animation: slideInBounce 0.4s ease-out;
      position: relative;
      overflow: hidden;
      width: 340px;
      margin: 0 auto;
      border: 1px solid rgba(136, 185, 249, 0.3);
      box-shadow: 0 4px 20px rgba(136, 185, 249, 0.15);
    }

    .reminder-wrapper::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg,
        #88B9F9 0%,
        #A8CCFA 50%,
        #88B9F9 100%);
      z-index: 1;
    }

    @keyframes slideInBounce {
      0% {
        transform: translateX(100%) scale(0.95);
        opacity: 0;
      }
      100% {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
    }

    @keyframes slideOutBounce {
      0% {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translateX(100%) scale(0.95);
        opacity: 0;
      }
    }

    @keyframes bellRing {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-8deg); }
      75% { transform: rotate(8deg); }
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(136, 185, 249, 0.1);
      padding: 12px 16px;
      border-bottom: 1px solid rgba(136, 185, 249, 0.15);
      border-radius: 8px 8px 0 0;
    }

    .header-left {
      display: flex;
      align-items: center;
    }

    .bell-icon {
      font-size: 16px;
      margin-right: 8px;
      animation: bellRing 2s ease-in-out infinite;
      color: #88B9F9;
    }

    .app-name {
      font-size: 13px;
      font-weight: 500;
      color: #4A5568;
      letter-spacing: 0.2px;
    }

    .close-button {
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 4px;
      transition: all 0.2s ease;
      background: rgba(136, 185, 249, 0.1);
      border: 1px solid rgba(136, 185, 249, 0.2);
      font-size: 12px;
      color: #6B7280;
      font-weight: 500;
    }

    .close-button:hover {
      background: rgba(136, 185, 249, 0.2);
      color: #4A5568;
    }

    .container {
      padding: 16px;
      background: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 0 0 8px 8px;
    }

    .container:hover {
      background: rgba(248, 250, 252, 0.9);
    }

    .todo-title {
      font-size: 14px;
      font-weight: 500;
      color: #2D3748;
      margin-bottom: 8px;
      line-height: 1.4;
      word-wrap: break-word;
      max-height: 42px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .reminder-text {
      font-size: 12px;
      color: #6B7280;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .time-icon {
      font-size: 12px;
      color: #88B9F9;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .btn {
      padding: 6px 12px;
      border: 1px solid;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 50px;
    }

    .btn-complete {
      background: #88B9F9;
      color: white;
      border-color: #88B9F9;
    }

    .btn-complete:hover {
      background: #6BA3F7;
      border-color: #6BA3F7;
      transform: translateY(-1px);
    }

    .btn-snooze {
      background: white;
      color: #6B7280;
      border-color: #D1D5DB;
    }

    .btn-snooze:hover {
      background: #F9FAFB;
      border-color: #9CA3AF;
      color: #4A5568;
      transform: translateY(-1px);
    }
  </style>
</head>
<body>
  <div class="reminder-wrapper">
    <div class="header">
      <div class="header-left">
        <div class="bell-icon">🔔</div>
        <div class="app-name">待办提醒</div>
      </div>
      <div class="close-button" id="closeButton">
        ✕
      </div>
    </div>
    <div class="container" id="container">
      <div class="todo-title" id="todoTitle"></div>
      <div class="reminder-text">
        <span class="time-icon">⏰</span>
        <span>提醒时间到了</span>
      </div>
      <div class="action-buttons">
        <button class="btn btn-complete" id="completeBtn">完成</button>
        <button class="btn btn-snooze" id="snoozeBtn">稍后</button>
      </div>
    </div>
  </div>

  <script>
    // 关闭按钮点击事件
    document.getElementById('closeButton').addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelector('.reminder-wrapper').style.animation = 'slideOutBounce 0.3s ease forwards';
      setTimeout(() => window.close(), 300);
    });

    // 完成按钮点击事件
    document.getElementById('completeBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      window.api.completeTodo(window.todoData?.id);
      document.querySelector('.reminder-wrapper').style.animation = 'slideOutBounce 0.3s ease forwards';
      setTimeout(() => window.close(), 300);
    });

    // 稍后提醒按钮点击事件
    document.getElementById('snoozeBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      window.api.snoozeTodo(window.todoData?.id, 10); // 10分钟后再次提醒
      document.querySelector('.reminder-wrapper').style.animation = 'slideOutBounce 0.3s ease forwards';
      setTimeout(() => window.close(), 300);
    });

    // 点击容器打开主窗口
    document.getElementById('container').addEventListener('click', () => {
      window.api.openMainWindowWithTodo(window.todoData?.id);
      document.querySelector('.reminder-wrapper').style.animation = 'slideOutBounce 0.3s ease forwards';
      setTimeout(() => window.close(), 300);
    });

    // 监听来自主进程的数据
    window.api.onTodoReminderData((data) => {
      window.todoData = data;
      document.getElementById('todoTitle').textContent = data.title;
    });
  </script>
</body>
</html>
`

// 设置主窗口引用
export function setMainWindow(window: BrowserWindow) {
  mainWindow = window
}

// 创建待办提醒通知
export function createTodoReminder(todoData: {
  id: number
  title: string
  reminderTime: string
}): BrowserWindow | null {
  // 检查主窗口状态，如果不是最小化或隐藏状态，则不显示通知
  if (mainWindow && !mainWindow.isMinimized() && mainWindow.isVisible()) {
    return null
  }

  const reminderWindow = new BrowserWindow({
    width: 360,
    height: REMINDER_HEIGHT,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    },
    resizable: false,
    transparent: true,
    show: false
  })

  // 使用data URL加载HTML内容
  reminderWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(todoReminderTemplate)}`)

  // 等待页面加载完成后发送数据
  reminderWindow.webContents.on('did-finish-load', () => {
    reminderWindow.webContents.send('todo-reminder-data', todoData)

    // 定位窗口
    positionReminderWindow(reminderWindow)
    reminderWindow.show()
  })

  // 窗口关闭时清理
  reminderWindow.on('closed', () => {
    const index = reminderWindows.indexOf(reminderWindow)
    if (index > -1) {
      reminderWindows.splice(index, 1)
    }
    repositionReminderWindows()
  })

  reminderWindows.push(reminderWindow)
  return reminderWindow
}

// 定位提醒窗口
function positionReminderWindow(window: BrowserWindow): void {
  const targetDisplay = mainWindow
    ? screen.getDisplayMatching(mainWindow.getBounds())
    : screen.getPrimaryDisplay()

  const { width, height, x: displayX, y: displayY } = targetDisplay.workArea
  const startX = displayX + width - 340
  const startY = displayY + height - reminderWindows.length * (REMINDER_HEIGHT + REMINDER_GAP)

  window.setPosition(startX, startY)
}

// 重新定位所有提醒窗口
function repositionReminderWindows(): void {
  reminderWindows.forEach((window, index) => {
    if (!window.isDestroyed()) {
      const targetDisplay = mainWindow
        ? screen.getDisplayMatching(mainWindow.getBounds())
        : screen.getPrimaryDisplay()

      const { width, height, x: displayX, y: displayY } = targetDisplay.workArea
      const startX = displayX + width - 340
      const startY = displayY + height - (index + 1) * (REMINDER_HEIGHT + REMINDER_GAP)

      window.setPosition(startX, startY)
    }
  })
}

// 设置待办提醒
export function setTodoReminder(todoData: {
  id: number
  text: string
  reminderTime: string
}): void {
  // 取消现有提醒
  cancelTodoReminder(todoData.id)

  const reminderTime = new Date(todoData.reminderTime).getTime()
  const now = Date.now()
  const delay = reminderTime - now

  if (delay > 0) {
    const timeout = setTimeout(() => {
      createTodoReminder({
        id: todoData.id,
        title: todoData.text,
        reminderTime: todoData.reminderTime
      })
      activeReminders.delete(todoData.id)
    }, delay)

    activeReminders.set(todoData.id, timeout)
  }
}

// 取消待办提醒
export function cancelTodoReminder(todoId: number): void {
  const timeout = activeReminders.get(todoId)
  if (timeout) {
    clearTimeout(timeout)
    activeReminders.delete(todoId)
  }
}

// 稍后提醒（延迟指定分钟数）
export function snoozeTodoReminder(todoId: number, minutes: number): void {
  cancelTodoReminder(todoId)

  const delay = minutes * 60 * 1000 // 转换为毫秒
  const timeout = setTimeout(() => {
    // 这里需要从存储中获取待办数据
    // 暂时使用占位符，实际实现时需要从数据库获取
    createTodoReminder({
      id: todoId,
      title: '待办提醒',
      reminderTime: new Date(Date.now() + delay).toISOString()
    })
    activeReminders.delete(todoId)
  }, delay)

  activeReminders.set(todoId, timeout)
}
