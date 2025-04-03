<template>
  <div class="page p-10px flex flex-1">
    <!-- 左侧区域：Todo 列表和操作 -->
    <div class="w-100% item-transition">
      <!-- Todo 列表 -->
      <div class="todo-list flex flex-col h-full">
        <div v-if="todos.length === 0" class="flex-center flex-1">
          <svg-icon
            name="empty"
            width="100%"
            height="100%"
            style="filter: hue-rotate(350deg); opacity: 0.6"
          />
        </div>
        <div v-else class="h-[calc(100%-20px)] overflow-y-auto px-4">
          <div
            v-for="group in groupedTodos"
            :key="group.dateKey"
            class="animate__animated animate__fadeInDown mb-4"
          >
            <n-card :bordered="false" class="shadow-sm hover:shadow-md transition-shadow">
              <template #header>
                <div class="group-header flex items-center px-2">
                  <div class="flex items-center gap-2">
                    <i i-solar-calendar-bold-duotone class="text-18px text-blue-500" />
                    <span class="text-16px font-600 text-gray-700">{{ group.title }}</span>
                    <n-tag size="small" :bordered="false" type="info" class="ml-2">
                      {{ group.tasks.length }}项
                    </n-tag>
                  </div>
                </div>
              </template>

              <div class="flex flex-col gap-2">
                <TodoItem
                  v-for="(todo, index) in group.tasks"
                  :key="todo.id"
                  :todo="todo"
                  :index="index"
                  :todos="group.tasks"
                  :check-box="false"
                  :collapsed="collapsed"
                  :delete-show="false"
                  :status-show="true"
                  class="hover:bg-gray-50 rounded p-2"
                  @delete-todo="deleteTodo"
                  @toggle-details="toggleDetails"
                  @toggle-sub-items-selection="toggleSubItemsSelection"
                />
              </div>

              <template #footer>
                <div class="flex items-center justify-between text-gray-400 text-12px">
                  <div class="flex items-center gap-2">
                    <span>完成：{{ getCompletedCount(group.tasks) }}</span>
                    <span>进行中：{{ group.tasks.length - getCompletedCount(group.tasks) }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <i i-solar-clock-circle-bold-duotone />
                    <span>{{ getGroupTimeInfo(group.dateKey) }}</span>
                  </div>
                </div>
              </template>
            </n-card>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧区域：Todo 详情 -->
    <div
      class="todo-details border-l border-gray-200 animate__animated overflow-y-auto item-transition bg-white shadow-xl theme-page absolute top-0 right-0 w-240px h-full"
      :class="[
        detailAnimate ? 'animate__fadeInRight w-[360px] ml-4 p-4' : 'animate__fadeOutRight w-0',
        collapsed ? 'h-400px' : ''
      ]"
    >
      <div v-show="detailVisible" class="h-full flex flex-col">
        <!-- 头部区域 -->
        <div class="p-3px bg-#CFCECD absolute top-42px right-10px flex-center rd-50%">
          <i
            i-solar-double-alt-arrow-right-line-duotone
            class="w-20px h-20px cursor-pointer hover:text-red-500"
            @click="hideDetails"
          />
        </div>

        <!-- 头部区域 -->
        <div class="flex justify-between items-start mb-4 pb-2 border-b border-gray-200">
          <h2 class="text-20px font-semibold text-gray-600 truncate w-full max-w-170px">
            {{ selectedTodo?.text }}
          </h2>
        </div>

        <!-- 主体内容 -->
        <div class="flex-1 h-100%">
          <!-- 基本信息卡片 -->
          <div class="mb-3 bg-gray-50 rounded-lg">
            <div class="space-y-6 theme-page">
              <div class="text-gray-600 text-14px">{{ selectedTodo?.text }}</div>
              <div>
                <label class="text-sm font-medium text-gray-500">详细描述</label>

                <div class="mt-1 text-gray-400 flex items-center gap-1">
                  <div class="flex items-center gap-1">
                    <p v-if="selectedTodo?.description" @click="inputVisible = true">
                      {{ selectedTodo?.description }}
                    </p>
                    <div v-else class="flex items-center gap-1">
                      {{ '无附加描述' }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1">
                <span class="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <i i-solar-fire-minimalistic-broken></i>
                  紧急程度：</span
                >
                {{
                  selectedTodo?.status === 1
                    ? '紧急'
                    : selectedTodo?.status === 2
                      ? '有点急'
                      : selectedTodo?.status === 3
                        ? '一般急'
                        : '不急'
                }}
              </div>

              <div class="flex items-center gap-1">
                <span class="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <i i-solar-tea-cup-broken></i>
                  状态：</span
                >
                <n-tag :type="selectedTodo?.completed ? 'success' : 'warning'" size="small">
                  {{ selectedTodo?.completed ? '已完成' : '进行中' }}
                </n-tag>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <i i-solar-history-2-outline></i>
                  创建时间</label
                >
                <div
                  class="mt-1 text-sm text-gray-400 max-w-140px overflow-hidden text-ellipsis text-nowrap"
                >
                  {{ selectedTodo?.createdAt }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import useThemeStore from '@renderer/stores/modules/theme'
import useUserStore from '@renderer/stores/modules/user'
import TodoItem from '@renderer/components/common/TodoItem.vue'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'

// 定义 Todo 类型，包括子项
export interface Todo {
  id: number
  text: string
  completed: boolean
  isRemove: boolean
  createdAt: string
  subTodos: Todo[] // 子项
  level: number
  description: string
  status: number
}

const useTheme = useThemeStore()
const useUser = useUserStore()

const todos = ref<Todo[]>([])
const selectedTodo = ref<Todo | null>(null)
const selectIndex = ref(0)
const collapsed = computed(() => useTheme.$state.collapsed)
const detailVisible = ref(false)
const detailAnimate = ref(false)
const inputVisible = ref(false)

// 配置 dayjs 插件
dayjs.extend(isToday)
dayjs.extend(isYesterday)

// 新增日期分组计算属性
const groupedTodos = computed(() => {
  const groups = new Map<
    string,
    {
      dateKey: string
      title: string
      tasks: Todo[]
    }
  >()

  todos.value.forEach((todo) => {
    // 统一日期格式处理
    const rawDate = todo.createdAt.replace(/\//g, '-') // 处理不同分隔符
    const dateObj = dayjs(rawDate.split(' ')[0]) // 取日期部分

    // 生成分组key
    let dateKey = ''
    if (dateObj.isToday()) {
      dateKey = 'today'
    } else if (dateObj.isYesterday()) {
      dateKey = 'yesterday'
    } else {
      dateKey = dateObj.format('YYYY-MM-DD')
    }

    // 初始化或更新分组
    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        dateKey,
        title: getGroupTitle(dateKey, dateObj),
        tasks: []
      })
    }
    groups.get(dateKey)?.tasks.push(todo)
  })

  // 转换为数组并按日期倒序排序
  return Array.from(groups.values()).sort(
    (a, b) => dayjs(b.dateKey).unix() - dayjs(a.dateKey).unix()
  )
})

// 获取分组标题
const getGroupTitle = (dateKey: string, dateObj: dayjs.Dayjs) => {
  switch (dateKey) {
    case 'today':
      return '今天'
    case 'yesterday':
      return '昨天'
    default:
      return dateObj.format('YYYY-MM-DD')
  }
}

// 删除 Todo 项
const deleteTodo = (data: any, index: number) => {
  data[index].isRemove = true
  setTimeout(() => {
    data.splice(index, 1)
    window.api.writeFile(useUser.historyFullPath, JSON.stringify(todos.value))
  }, 500)
  hided()
}

const hided = () => {
  detailVisible.value = false
  selectedTodo.value = null
  detailAnimate.value = false
}

// 切换详情显示和隐藏
const toggleDetails = (todo: Todo, index: number) => {
  selectIndex.value = index
  if (selectedTodo.value && selectedTodo.value.id === todo.id) {
    hided()
  } else {
    selectedTodo.value = todo
    detailVisible.value = true
    detailAnimate.value = true
  }
}

// 隐藏详情页
const hideDetails = () => {
  hided()
}

// 子项勾选时，切换所有子项的状态
const toggleSubItemsSelection = (todo: Todo) => {
  const isSelected = todo.completed
  todo.subTodos.forEach((subTodo) => {
    subTodo.completed = isSelected
    // 子项的子项（递归）
    subTodo.subTodos?.forEach((subSubTodo) => {
      subSubTodo.completed = isSelected
    })
  })
}

onMounted(() => {
  // 读取文件内容
  const data = window.api.readFile(useUser.historyFullPath)
  if (data) {
    todos.value = data
  }
})

// 添加新的工具方法
const getCompletedCount = (tasks: Todo[]) => {
  return tasks.filter((task) => task.completed).length
}

const getGroupTimeInfo = (dateKey: string) => {
  if (dateKey === 'today') {
    return '今天'
  } else if (dateKey === 'yesterday') {
    return '昨天'
  } else {
    const date = dayjs(dateKey)
    const diffDays = dayjs().diff(date, 'day')
    return `${diffDays}天前`
  }
}
</script>

<style lang="scss">
.item-transition {
  transition: all 0.3s;
}

.todo-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.todo-item:hover {
  transition: all 0.3s;
}

.todo-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

.todo-details {
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.line-through {
  text-decoration: line-through;
}

.max-length {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-subitems {
  padding-left: 20px;
}

// 添加新的样式
.n-card {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.todo-list {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #d1d5db;
  }
}
</style>
