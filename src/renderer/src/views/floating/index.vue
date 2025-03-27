<template>
  <div class="floating-window theme-page" :class="{ 'is-menu-open': isMenuOpen }">
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
import { ref, onMounted } from 'vue'
import useUserStore from '@renderer/stores/modules/user'

interface Todo {
  id: number
  text: string
  completed: boolean
  isRemove: boolean
  createdAt: string
  subTodos: Todo[] // 子项
  level: number
  description: string
  status: number
  isLeave?: boolean
}

const useUser = useUserStore()

const todos = ref<Todo[]>([])

const todoList = computed(() => {
  // 只获取未完成的紧急任务
  return todos.value.filter((todo: Todo) => todo.status === 1 && !todo.completed).splice(0, 3)
})

onMounted(() => {
  const type = JSON.parse(localStorage.getItem('theme') as string) || { themeType: 'light' }
  window.document.documentElement.setAttribute('data-theme', type.themeType)

  const data = Array.isArray(window.api.readFile(useUser.fileFullPath))
    ? window.api.readFile(useUser.fileFullPath)
    : []

  todos.value = data
})

const handleMouseDown = () => {
  isMenuOpen.value = !isMenuOpen.value
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
    // 在原数据中找到并更新这个 todo
    const targetTodo = todos.value.find((item) => item.id === todo.id)
    if (targetTodo) {
      targetTodo.completed = true
      delete targetTodo.isLeave // 移除临时标记
    }

    // 写入更新后的数据
    await window.api.writeFile(useUser.fileFullPath, JSON.stringify(todos.value))

    // 重新获取数据以更新显示
    todos.value = Array.isArray(window.api.readFile(useUser.fileFullPath))
      ? window.api.readFile(useUser.fileFullPath)
      : []
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
  -webkit-app-region: drag; /* 使整个header可拖拽 */
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
