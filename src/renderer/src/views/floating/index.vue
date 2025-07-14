<template>
  <div class="floating-window theme-page drag" :class="{ 'is-menu-open': isMenuOpen }">
    <div v-if="!isMenuOpen" class="click-area" @click="handleMouseDown">
      <img src="@renderer/assets/img/float.gif" class="float_home" alt="" />
    </div>
    <div v-else class="flex flex-col flex-1 h-full">
      <div class="text-12px flex flex-col gap-5px">
        正在进行的紧急待办
        <div v-if="todoList.length === 0" class="flex-center">
          <svg-icon
            name="empty"
            width="50px"
            height="50px"
            style="filter: hue-rotate(350deg); opacity: 0.8"
          />
        </div>
        <div v-else class="w-full flex flex-col gap-5px">
          <div
            v-for="item in todoList"
            :key="item?.id"
            class="w-100px truncate hover:text-blue-500 transition-colors cursor-pointer animate__animated"
            :class="item.isLeave ? 'animate__fadeOutLeft' : 'animate__fadeInRight'"
            @click="completeTodo(item)"
          >
            {{ item?.text }}
          </div>
        </div>
      </div>
      <div class="mt-auto">
        <div
          v-for="(item, index) in icons"
          :key="index"
          class="menu-icon"
          @click.stop="handleIconClick(item.icon)"
        >
          <i :class="item.icon" />
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import useUserStore from '@renderer/stores/modules/user'

interface Todo {
  id: number
  text: string
  completed: boolean
  isRemove: boolean
  createdAt: string
  completedAt: string
  subTodos: Todo[] // 子项
  level: number
  description: string
  status: number
  isLeave?: boolean
  reminderTime?: string
  reminderEnabled?: boolean
}

const useUser = useUserStore()

const todos = ref<Todo[]>([])
const historyData = ref<Todo[]>([])

// 获取所有紧急的未完成待办（不限制今天）
const todoList = computed(() => {
  // 合并今日待办和历史数据中的所有待办
  const allTodos = [...todos.value, ...historyData.value]

  // 去重（以id为准）
  const uniqueTodos = allTodos.filter(
    (todo, index, self) => index === self.findIndex((t) => t.id === todo.id)
  )

  // 只获取未完成的紧急任务，最多显示3个
  return uniqueTodos.filter((todo: Todo) => todo.status === 1 && !todo.completed).slice(0, 3)
})

// 同步更新历史数据中的待办项
const syncHistoryData = (updatedTodo: Todo) => {
  const historyIndex = historyData.value.findIndex((item) => item.id === updatedTodo.id)
  if (historyIndex !== -1) {
    // 更新历史数据中的对应项
    historyData.value[historyIndex] = { ...updatedTodo }
  }
}

onMounted(async () => {
  const type = JSON.parse(localStorage.getItem('theme') as string) || { themeType: 'light' }
  window.document.documentElement.setAttribute('data-theme', type.themeType)

  try {
    // 使用新的存储方式获取今日待办数据
    const todayData = await window.store.get('todayTodos', [])
    todos.value = Array.isArray(todayData) ? todayData : []

    // 获取历史数据
    const historyDataValue = await window.store.get('historyData', [])
    historyData.value = Array.isArray(historyDataValue) ? historyDataValue : []
  } catch (error) {
    console.error('获取数据失败:', error)
    todos.value = []
    historyData.value = []
  }
})

const handleMouseDown = () => {
  isMenuOpen.value = !isMenuOpen.value
  console.log('🚀 ~ handleMouseDown ~ isMenuOpen.value:', isMenuOpen.value)
}

// 控制菜单是否打开
const isMenuOpen = ref(false)

// 图标列表
const icons = ref([
  {
    name: '还原',
    icon: 'i-solar-planet-2-broken'
  },
  {
    name: '返回',
    icon: 'i-solar-undo-right-round-broken'
  }
])

// 处理图标点击事件
const handleIconClick = (icon: string) => {
  if (icon === 'i-solar-planet-2-broken') {
    // 打开主窗口
    window.electron.ipcRenderer.invoke('show-main-window')
    // 关闭悬浮窗
    window.electron.ipcRenderer.invoke('destroy-floating-window')
  }

  if (icon === 'i-solar-undo-right-round-broken') {
    handleMouseDown()
  }
}

const completeTodo = async (todo: Todo) => {
  // 添加临时的 isLeave 标记用于动画
  todo.isLeave = true

  // 等待动画完成
  setTimeout(async () => {
    try {
      // 在今日待办中查找并更新
      const todayTodoIndex = todos.value.findIndex((item) => item.id === todo.id)
      if (todayTodoIndex !== -1) {
        todos.value[todayTodoIndex].completed = true
        todos.value[todayTodoIndex].completedAt = new Date().toLocaleString()
        delete todos.value[todayTodoIndex].isLeave
      }

      // 在历史数据中查找并更新
      const historyTodoIndex = historyData.value.findIndex((item) => item.id === todo.id)
      if (historyTodoIndex !== -1) {
        historyData.value[historyTodoIndex].completed = true
        historyData.value[historyTodoIndex].completedAt = new Date().toLocaleString()
        delete historyData.value[historyTodoIndex].isLeave
      }

      // 使用新的存储方式保存数据
      await window.store.set('todayTodos', JSON.parse(JSON.stringify(todos.value)))
      await window.store.set('historyData', JSON.parse(JSON.stringify(historyData.value)))
    } catch (error) {
      console.error('保存数据失败:', error)
    }
  }, 500)
}
</script>

<style scoped lang="scss">
.floating-window {
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 5px;
  position: fixed; /* 添加固定定位 */
  right: 10px; /* 固定在右侧 */
  bottom: 10px; /* 固定在底部 */
  transform-origin: right bottom;
}

.is-menu-open {
  width: 130px;
  height: 170px;
  -webkit-app-region: no-drag;
  border-radius: 10px;
  align-items: flex-start;
}

/* 中心点击区域 */
.click-area {
  display: flex;
  justify-content: center;
  align-items: center;
  -webkit-app-region: no-drag;
}

.menu-icon {
  @apply flex w-100% items-center gap-10px text-13px p-10px rounded-10px cursor-pointer;
  transition: all 0.3s ease;

  i {
    @apply w-16px h-16px mb-2px;
  }

  &:hover {
    background: #e6f3fe;
    color: #78b3e3;
    transition: all 0.3s ease;
  }
}

.float_home {
  user-drag: none;

  -webkit-user-drag: none;

  -moz-user-drag: none;

  -ms-user-drag: none;
  width: 30px;
  height: 30px;
}
</style>
