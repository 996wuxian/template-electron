<template>
  <div class="page p-10px flex flex-1" @click="handleOutsideClick">
    <!-- 左侧区域：Todo 列表和操作 -->
    <div class="w-100% item-transition">
      <!-- 输入框 -->
      <n-input
        v-model:value="value"
        type="text"
        placeholder="输入后按回车添加"
        clearable
        size="large"
        class="text-14px animate__animated animate__fadeInDown"
        @keyup.enter="addTodo"
      />

      <!-- Todo 列表 -->
      <div class="todo-list mt-4 flex flex-col h-[calc(100%-100px)]">
        <div v-if="todos.length === 0" class="flex-center flex-1">
          <svg-icon
            name="empty"
            width="100%"
            height="100%"
            style="filter: hue-rotate(350deg); opacity: 0.6"
          />
        </div>
        <div v-else class="h-[calc(100%-20px)] overflow-y-auto w-100%">
          <div class="h-[calc(100%-20px)] overflow-y-auto w-100%">
            <!-- 按日期分组显示 -->
            <div v-for="group in groupedTodayTodos" :key="group.dateKey" class="mb-4">
              <!-- 分组标题 -->
              <div v-if="group.dateKey !== 'today'" class="flex items-center gap-2 mb-2 px-2">
                <i class="i-solar-clock-circle-bold-duotone text-orange-500"></i>
                <span class="text-12px font-600 text-orange-600">{{ group.title }}</span>
                <n-tag size="small" type="warning" :bordered="false">
                  {{ group.tasks.length }}项未完成
                </n-tag>
              </div>

              <!-- 任务列表 -->
              <VueDraggable
                v-model="group.tasks"
                :animation="150"
                class="flex flex-col gap-2 p-4 bg-gray-500/5 rounded"
                :class="{ 'bg-gray-500/5 border': group.dateKey !== 'today' }"
                @start="onStart"
                @end="onEnd"
              >
                <TodoItem
                  v-for="(todo, index) in group.tasks"
                  :key="todo.id"
                  :todo="todo"
                  :index="index"
                  :todos="group.tasks"
                  :collapsed="collapsed"
                  :check-box="true"
                  :delete-show="true"
                  :status-show="true"
                  @click.stop
                  @delete-todo="deleteTodo"
                  @toggle-details="toggleDetails"
                  @toggle-sub-items-selection="toggleSubItemsSelection"
                  @complete-and-delete="completeAndDelete"
                  @save-todo="saveTodoInline"
                />
              </VueDraggable>
            </div>
          </div>
        </div>
      </div>

      <!-- 全选和批量删除 -->
      <div v-if="todayTodos.length > 0" class="todo-actions mt-4 flex items-center mt-auto">
        <n-checkbox
          v-model:checked="selectAll"
          class="min-w-60px"
          @update:checked="toggleSelectAll"
        >
          全选
        </n-checkbox>
        <i i-solar-restart-broken class="cursor-pointer text-16px" @click="fetchData"></i>
        <div v-if="!collapsed" class="flex ml-10px">
          已完成 : {{ selected.length }} / 总数量 : {{ todayTodos.length }}
        </div>
        <div
          v-show="!detailVisible && !useUser.isRightTop && !useUser.isHide"
          class="flex ml-40px gap-20px min-w-200px overflow-hidden"
        >
          <div class="flex items-center gap-5px text-13px">
            <span class="w-15px h-15px rounded-50% bg-red"></span>
            紧急
          </div>
          <div class="flex items-center gap-5px text-13px">
            <span class="w-15px h-15px rounded-50% bg-orange"></span>
            有点急
          </div>
          <div class="flex items-center gap-5px text-13px">
            <span class="w-15px h-15px rounded-50% bg-gray"></span>
            一般急
          </div>
          <div class="flex items-center gap-5px text-13px">
            <span class="w-15px h-15px rounded-50% bg-green-500"></span>
            不急
          </div>
        </div>
        <i
          i-solar-trash-bin-minimalistic-2-linear
          class="w-20px h-20px hover:text-red-500 cursor-pointer ml-auto"
          @click.stop="deleteSelected"
        ></i>
      </div>
    </div>

    <!-- 右侧区域：Todo 详情 -->
    <div
      v-if="detailVisible && !collapsed"
      class="todo-details border-l border-gray-200 pr-10px animate __animated overflow-y-auto item-transition bg-white shadow-xl theme-page absolute top-0 right-0 h-full"
      :class="[
        detailAnimate
          ? 'animate__fadeInRight w-[300px] ml-4 p-4 pr-0 opacity-100 visible'
          : 'animate__fadeOutRight w-0 p-0 pr-0 overflow-hidden pointer-events-none opacity-0 invisible',
        collapsed ? 'h-400px' : ''
      ]"
      @click.stop
    >
      <!-- 头部区域 -->
      <div
        class="flex justify-between items-center mb-4 pb-2 border-b border-gray-200 no-drag"
        :class="themeType === 'dark' ? 'text-gray-100' : 'text-gray-600'"
      >
        <h2 class="text-18px truncate w-full max-w-240px">
          {{ selectedTodo?.text }}
        </h2>

        <i
          i-solar-close-circle-broken
          class="text-18px cursor-pointer hover:text-red-500 transition-all"
          @click="hideDetails"
        />
      </div>

      <!-- 主体内容 -->
      <div class="flex-1 h-[calc(100%-200px)] overflow-y-auto">
        <!-- 基本信息卡片 -->
        <div class="mb-3 bg-gray-50 rounded-lg">
          <div class="space-y-4 theme-page">
            <!-- 修改这部分 -->
            <div
              class="text-14px"
              :class="themeType === 'dark' ? 'text-gray-100' : 'text-gray-600'"
            >
              <n-input
                v-if="textInputVisible && selectedTodo"
                v-model:value="selectedTodo.text"
                placeholder="输入内容"
                size="medium"
                type="textarea"
                :autosize="{
                  minRows: 3,
                  maxRows: 5
                }"
                @blur="textChange"
              />
              <div v-else class="cursor-pointer w-full break-words" @click="editText">
                {{ selectedTodo?.text }}
              </div>
            </div>

            <div>
              <label
                class="text-sm font-medium"
                :class="themeType === 'dark' ? 'text-gray-200' : 'text-gray-500'"
              >
                详细描述
              </label>

              <div
                class="mt-1 flex items-center gap-1"
                :class="themeType === 'dark' ? 'text-gray-300' : 'text-gray-400'"
              >
                <n-input
                  v-if="inputVisible && selectedTodo"
                  v-model:value="selectedTodo.description"
                  placeholder="输入描述"
                  size="medium"
                  @blur="descChange"
                />
                <div
                  v-else
                  class="flex items-center gap-1 text-13px"
                  :class="themeType === 'dark' ? 'text-gray-300' : 'text-gray-400'"
                >
                  <p v-if="selectedTodo?.description" @click="inputVisible = true">
                    {{ selectedTodo?.description }}
                  </p>
                  <div v-else class="flex items-center gap-1 text-13px">
                    {{ '无附加描述' }}
                    <i i-solar-pen-2-broken @click="editDescription"></i>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <span
                class="text-sm font-medium flex items-center gap-1 flex-1"
                :class="themeType === 'dark' ? 'text-gray-200' : 'text-gray-500'"
              >
                <i i-solar-fire-minimalistic-broken></i>
                紧急程度：</span
              >
              <n-select
                v-if="selectedTodo"
                v-model:value="selectedTodo.status"
                size="small"
                class="w-90px"
                :options="options"
                @update:value="saveTodo"
              />
            </div>

            <div class="flex items-center gap-1">
              <span
                class="text-sm font-medium flex items-center gap-1"
                :class="themeType === 'dark' ? 'text-gray-200' : 'text-gray-500'"
              >
                <i i-solar-tea-cup-broken></i>
                状态：</span
              >
              <n-tag :type="selectedTodo?.completed ? 'success' : 'warning'" size="small">
                {{ selectedTodo?.completed ? '已完成' : '进行中' }}
              </n-tag>
            </div>

            <div>
              <label
                class="text-sm font-medium flex items-center gap-1"
                :class="themeType === 'dark' ? 'text-gray-200' : 'text-gray-500'"
              >
                <i i-solar-history-2-outline></i>
                创建时间</label
              >
              <div
                class="mt-1 text-sm max-w-140px overflow-hidden text-ellipsis text-nowrap"
                :class="themeType === 'dark' ? 'text-gray-300' : 'text-gray-400'"
              >
                {{ selectedTodo?.createdAt }}
              </div>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-2">
                <label
                  class="text-sm font-medium flex items-center gap-1"
                  :class="themeType === 'dark' ? 'text-gray-200' : 'text-gray-500'"
                >
                  <i i-solar-bell-bing-bold-duotone></i>
                  待办提醒
                </label>
                <n-switch
                  v-if="selectedTodo"
                  v-model:value="selectedTodo.reminderEnabled"
                  size="small"
                  @update:value="saveReminderSettings"
                />
              </div>
              <div v-if="selectedTodo?.reminderEnabled" class="mt-2">
                <n-time-picker
                  v-if="selectedTodo"
                  v-model:value="reminderTimeValue"
                  default-formatted-value="00:12"
                  format="HH:mm"
                  placeholder="选择提醒时间"
                  size="small"
                  class="w-full"
                  @update:value="updateReminderTime"
                />
                <div
                  v-if="selectedTodo?.reminderTime"
                  class="mt-1 text-xs"
                  :class="themeType === 'dark' ? 'text-gray-300' : 'text-gray-400'"
                >
                  提醒时间: {{ formatReminderTime(selectedTodo.reminderTime) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 子任务区域 -->
        <div class="border-t pt-4 h-[calc(100%-250px)]">
          <div class="flex items-center justify-between mb-4">
            <h3
              class="font-medium flex items-center gap-2"
              :class="themeType === 'dark' ? 'text-gray-100' : 'text-gray-700'"
            >
              <i
                i-solar-paperclip-bold-duotone
                class="w-4 h-4"
                :class="themeType === 'dark' ? 'text-blue-400' : 'text-blue-500'"
              />
              子任务 ({{ selectedTodo?.subTodos?.length || 0 }})
            </h3>
            <span
              v-if="!collapsed"
              class="text-xs"
              :class="themeType === 'dark' ? 'text-gray-300' : 'text-gray-400'"
            >
              最大支持4级嵌套
            </span>
          </div>

          <!-- 添加子项 -->
          <div v-if="selectedTodo && selectedTodo?.level < 4" class="mb-4">
            <n-input
              v-model:value="newSubTodoText"
              placeholder="输入子任务内容"
              size="medium"
              round
              @keyup.enter="addSubTodo"
            >
              <template #suffix>
                <i
                  class="i-solar-add-circle-line-duotone"
                  :class="themeType === 'dark' ? 'text-gray-300' : 'text-gray-400'"
                />
              </template>
            </n-input>
          </div>

          <!-- 子项列表 -->
          <div v-if="selectedTodo?.subTodos?.length" class="h-[calc(100%-100px)] overflow-y-auto">
            <div
              v-for="subTodo in selectedTodo.subTodos"
              :key="subTodo.id"
              class="group flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <n-checkbox
                v-model:checked="subTodo.completed"
                class="mr-3"
                :class="{ 'opacity-50': subTodo.completed }"
              />
              <span
                class="flex-1 transition-all"
                :class="[
                  themeType === 'dark' ? 'text-gray-200' : 'text-gray-500',
                  subTodo.completed
                    ? themeType === 'dark'
                      ? 'line-through text-gray-400'
                      : 'line-through text-gray-400'
                    : 'opacity-75 hover:opacity-100'
                ]"
              >
                {{ subTodo.text }}
              </span>
              <i
                v-if="subTodo.subTodos?.length"
                class="i-solar-arrow-right-line-duotone ml-2 group-hover:text-blue-500"
                :class="themeType === 'dark' ? 'text-gray-400' : 'text-gray-300'"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import useThemeStore from '@renderer/stores/modules/theme'
import useUserStore from '@renderer/stores/modules/user'
import TodoItem from '@renderer/components/common/TodoItem.vue'
import { $msg } from '@renderer/config/interaction.config'
import dayjs from 'dayjs'
import { type DraggableEvent, VueDraggable } from 'vue-draggable-plus'

// 定义 Todo 类型，包括子项
export interface Todo {
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
  sort: number
  reminderTime?: string
  reminderEnabled?: boolean
  deletedFromHome?: boolean // 标记是否从home页删除
}

const useTheme = useThemeStore()
const useUser = useUserStore()

const value = ref('')
const todos = ref<Todo[]>([])
const selectedTodo = ref<Todo | null>(null)
const selectIndex = ref(0)
const newSubTodoText = ref('')
const selectAll = ref(false)
const collapsed = computed(() => useTheme.$state.collapsed)
const themeType = computed(() => useTheme.$state.themeType)
const detailVisible = ref(false)
const detailAnimate = ref(false)
const inputVisible = ref(false)
const reminderTimeValue = ref<number | null>(null)

const selected = computed(() => todayTodos.value.filter((todo) => todo.completed))
const historyData = ref<Todo[]>([])

const todayTodos = computed(() => {
  return todos.value.filter((todo) => {
    // 过滤掉从home页删除的项目
    if (todo.deletedFromHome) return false

    const isToday = isTodoCreatedToday(todo.createdAt)
    // 如果是今天的任务，全部显示
    if (isToday) return true
    // 如果是历史任务，只要是今天完成的或者未完成的都显示
    const completedToday = todo.completed && dayjs(todo.completedAt).isSame(dayjs(), 'day')
    return !todo.completed || completedToday
  })
})

const options = [
  {
    label: '紧急',
    value: 1
  },
  {
    label: '有点急',
    value: 2
  },
  {
    label: '一般急',
    value: 3
  },
  {
    label: '不急',
    value: 4
  }
]

// 同步更新历史数据中的待办项
const syncHistoryData = (updatedTodo: Todo) => {
  const historyIndex = historyData.value.findIndex((item) => item.id === updatedTodo.id)
  if (historyIndex !== -1) {
    // 更新历史数据中的对应项
    historyData.value[historyIndex] = { ...updatedTodo }
  }
}

const saveReminderSettings = async () => {
  if (selectedTodo.value) {
    if (!selectedTodo.value.reminderEnabled) {
      selectedTodo.value.reminderTime = undefined
      reminderTimeValue.value = null
      // 取消现有提醒
      await window.electron.ipcRenderer.invoke('cancel-todo-reminder', selectedTodo.value.id)
    }
    syncHistoryData(selectedTodo.value)
    await saveTodo()
  }
}

const updateReminderTime = async (value: number | null) => {
  if (selectedTodo.value && value !== null) {
    // 将毫秒数转换为今天的具体时间
    const today = new Date()
    const timeDate = new Date(value)
    const reminderDateTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      timeDate.getHours(),
      timeDate.getMinutes(),
      timeDate.getSeconds()
    )

    // 如果选择的时间已经过了今天，则设置为明天的这个时间
    if (reminderDateTime.getTime() < Date.now()) {
      reminderDateTime.setDate(reminderDateTime.getDate() + 1)
    }

    selectedTodo.value.reminderTime = reminderDateTime.toISOString()
    syncHistoryData(selectedTodo.value)
    await saveTodo()

    // 设置提醒
    await window.electron.ipcRenderer.invoke('set-todo-reminder', {
      id: selectedTodo.value.id,
      text: selectedTodo.value.text,
      reminderTime: selectedTodo.value.reminderTime
    })
  }
}

const formatReminderTime = (timeStr: string) => {
  return dayjs(timeStr).format('YYYY-MM-DD HH:mm')
}

// 添加 Todo 项
const addTodo = async () => {
  if (value.value.trim()) {
    try {
      const newTodo = {
        id: Date.now(),
        text: value.value,
        completed: false,
        isRemove: false,
        createdAt: new Date().toLocaleString(),
        subTodos: [],
        level: 1,
        description: '',
        status: 4,
        sort: todos.value.length,
        completedAt: '',
        reminderTime: undefined,
        reminderEnabled: false,
        deletedFromHome: false
      }

      // 使用新的存储方式
      const currentHistoryData = await window.store.get('historyData', [])
      const updatedHistoryData = [...currentHistoryData, newTodo]

      todos.value.push(newTodo)
      historyData.value = updatedHistoryData
      value.value = ''

      // 保存到新的存储系统 - 转换为普通对象
      await window.store.set('todayTodos', JSON.parse(JSON.stringify(todayTodos.value)))
      await window.store.set('historyData', JSON.parse(JSON.stringify(updatedHistoryData)))
    } catch (error) {
      console.error('保存失败:', error)
    }
  }
}

// 删除 Todo 项
const deleteTodo = (data: any, index: number) => {
  const todoToDelete = data[index]
  if (!todoToDelete) return

  // 标记为删除状态
  todoToDelete.isRemove = true

  // 如果当前选中的是要删除的todo，关闭详情页
  if (selectedTodo.value && selectedTodo.value.id === todoToDelete.id) {
    hided()
  }

  setTimeout(async () => {
    // 从原始todos数组中根据ID删除
    const todoIndex = todos.value.findIndex((todo) => todo.id === todoToDelete.id)
    if (todoIndex !== -1) {
      todos.value.splice(todoIndex, 1)
    }

    // 在historyData中标记为从home页删除，而不是直接删除
    const historyIndex = historyData.value.findIndex((todo) => todo.id === todoToDelete.id)
    if (historyIndex !== -1) {
      historyData.value[historyIndex].deletedFromHome = true
    }

    // 保存数据
    await window.store.set('todayTodos', JSON.parse(JSON.stringify(todayTodos.value)))
    await window.store.set('historyData', JSON.parse(JSON.stringify(historyData.value)))
  }, 500)
}

const hided = () => {
  detailAnimate.value = false
  setTimeout(() => {
    detailVisible.value = false
    selectedTodo.value = null
  }, 300) // 等待动画完成
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

    // 加载提醒时间到时间选择器
    if (todo.reminderTime) {
      const reminderDate = new Date(todo.reminderTime)
      // 创建一个只包含时间的Date对象（今天的日期 + 提醒时间）
      const timeOnly = new Date()
      timeOnly.setHours(
        reminderDate.getHours(),
        reminderDate.getMinutes(),
        reminderDate.getSeconds(),
        0
      )
      reminderTimeValue.value = timeOnly.getTime()
    } else {
      reminderTimeValue.value = null
    }
  }
}

// 隐藏详情页
const hideDetails = () => {
  hided()
}

// 添加子项
const addSubTodo = async () => {
  if (newSubTodoText.value.trim() && selectedTodo.value) {
    const newSubTodo = {
      id: Date.now(),
      completed: false,
      isRemove: false,
      createdAt: new Date().toLocaleString(), // 格式化当前时间
      subTodos: [], // 初始化子项为空数组
      text: newSubTodoText.value,
      level: selectedTodo.value.level + 1,
      description: '',
      status: 4,
      sort: selectedTodo.value.subTodos.length,
      completedAt: ''
    }
    selectedTodo.value.subTodos.push(newSubTodo)

    // 同步更新父任务的历史记录
    syncHistoryData(selectedTodo.value)

    await window.store.set('todayTodos', JSON.parse(JSON.stringify(todayTodos.value)))
    await window.store.set('historyData', JSON.parse(JSON.stringify(historyData.value)))
    newSubTodoText.value = ''
  }
}

// 切换全选状态
const toggleSelectAll = async () => {
  todos.value.forEach((todo) => {
    todo.completed = selectAll.value
    todo.completedAt = selectAll.value ? new Date().toLocaleString() : ''
    todo.subTodos.forEach((subTodo) => {
      subTodo.completed = selectAll.value
    })

    // 同步历史数据
    syncHistoryData(todo)

    todo.subTodos.forEach((subTodo) => {
      subTodo.completed = selectAll.value
      subTodo.completedAt = selectAll.value ? new Date().toLocaleString() : ''
      // 同步子任务的历史数据
      syncHistoryData(subTodo)
    })
  })

  await window.store.set('todayTodos', JSON.parse(JSON.stringify(todayTodos.value)))

  await window.store.set('historyData', JSON.parse(JSON.stringify(historyData.value)))
}

// 删除选中的 Todo 项
const deleteSelected = () => {
  todos.value.forEach((element) => {
    if (!element.completed) return
    element.isRemove = true
    element.subTodos.forEach((subTodo) => {
      if (subTodo.completed) {
        subTodo.isRemove = true
      }
    })
  })

  setTimeout(async () => {
    todos.value = todos.value.filter((todo) => !todo.completed)
    selectAll.value = false

    // 使用新的存储方式 - 转换为普通对象
    await window.store.set('todayTodos', JSON.parse(JSON.stringify(todos.value)))
  }, 500)

  hided()
}

// 子项勾选时，切换所有子项的状态
const toggleSubItemsSelection = async (todo: Todo) => {
  const isSelected = todo.completed
  const completedAt = isSelected ? new Date().toLocaleString() : ''

  // 递归更新所有子项状态的函数
  const updateSubTodosStatus = (subTodos: Todo[]) => {
    subTodos.forEach((subTodo) => {
      subTodo.completed = isSelected
      subTodo.completedAt = completedAt
      if (subTodo.subTodos?.length) {
        updateSubTodosStatus(subTodo.subTodos)
      }
    })
  }

  todo.completed = isSelected
  todo.completedAt = completedAt
  syncHistoryData(todo)

  // 更新当前 todo 的所有子项状态
  updateSubTodosStatus(todo.subTodos)

  // 更新 historyData 中对应的 todo 及其子项状态
  const updateHistoryTodoStatus = (todoId: number) => {
    const historyTodo = historyData.value.find((item) => item.id === todoId)
    if (historyTodo) {
      historyTodo.completed = isSelected
      historyTodo.completedAt = completedAt
      if (historyTodo.subTodos?.length) {
        updateSubTodosStatus(historyTodo.subTodos)
      }
    }
  }

  // 更新主任务状态
  updateHistoryTodoStatus(todo.id)
  // 更新所有子任务状态
  todo.subTodos.forEach((subTodo) => {
    updateHistoryTodoStatus(subTodo.id)
  })

  // 使用新的存储方式保存数据
  await window.store.set('todayTodos', JSON.parse(JSON.stringify(todayTodos.value)))

  await window.store.set('historyData', JSON.parse(JSON.stringify(historyData.value)))

  // 更新全选状态
  if (todos.value.length > 0) {
    const allSelected = todos.value.every((todo) => todo.completed)
    selectAll.value = allSelected
  }
}

const editDescription = () => {
  inputVisible.value = !inputVisible.value
}

const saveTodo = async () => {
  // 如果是修改了紧急程度，同步更新子任务的状态
  if (selectedTodo.value) {
    const updateSubTodosStatus = (subTodos: Todo[]) => {
      subTodos.forEach((subTodo) => {
        subTodo.status = selectedTodo.value!.status
        if (subTodo.subTodos?.length) {
          updateSubTodosStatus(subTodo.subTodos)
        }
      })
    }

    updateSubTodosStatus(selectedTodo.value.subTodos)
    // 同步主任务的历史数据
    syncHistoryData(selectedTodo.value)
  }

  await window.store.set('todayTodos', JSON.parse(JSON.stringify(todayTodos.value)))
  await window.store.set('historyData', JSON.parse(JSON.stringify(historyData.value)))
}

const saveTodoInline = async (todo: Todo) => {
  const newText = (todo.text || '').trim()
  if (newText.length === 0) {
    $msg({ type: 'warning', msg: '名称不能为空' })
    const original = historyData.value.find((t) => t.id === todo.id)
    if (original) {
      todo.text = original.text
    }
    return
  }
  // 名称修改：同步到历史记录并保存
  syncHistoryData(todo)
  await saveTodo()
}

const textInputVisible = ref(false)

// 添加编辑文本的方法
const editText = () => {
  textInputVisible.value = true
}

// 添加文本修改完成的方法
const textChange = async () => {
  textInputVisible.value = false

  if (selectedTodo.value) {
    const newText = (selectedTodo.value.text || '').trim()
    if (newText.length === 0) {
      $msg({ type: 'warning', msg: '名称不能为空' })
      const original = historyData.value.find((t) => t.id === selectedTodo.value!.id)
      if (original) {
        selectedTodo.value.text = original.text
      }
      return
    }
    // 同步历史数据
    syncHistoryData(selectedTodo.value)
  }
  await saveTodo()
}

const descChange = async () => {
  inputVisible.value = false
  // 同步历史数据
  if (selectedTodo.value) {
    syncHistoryData(selectedTodo.value)
  }
  await saveTodo()
}

// 判断 todo 是否是今天创建的
const isTodoCreatedToday = (createdAt: string) => {
  return dayjs(createdAt).isSame(dayjs(), 'day')
}

// 添加获取数据的方法
const fetchData = async () => {
  try {
    // 从新的存储系统读取数据
    const todayData = await window.store.get('todayTodos', [])
    const historyDataFromStore = await window.store.get('historyData', [])

    // 过滤掉从home页删除的项目
    todos.value = todayData.filter((todo: Todo) => !todo.deletedFromHome)
    console.log('🚀 ~ fetchData ~ todos.value:', todos.value)
    historyData.value = historyDataFromStore
  } catch (error) {
    console.error('读取数据失败:', error)
    todos.value = []
    historyData.value = []
  }
}

const onStart = (e: DraggableEvent) => {
  const draggedItem = todayTodos.value[e.oldIndex!]
  if (draggedItem) {
    draggedItem.isRemove = false
  }
}

const onEnd = async (e: DraggableEvent) => {
  if (e.newIndex === e.oldIndex) return

  try {
    // 获取拖拽的项目
    const draggedTodo = todayTodos.value[e.oldIndex!]
    const targetTodo = todayTodos.value[e.newIndex!]

    // 交换 sort 值
    const tempSort = draggedTodo.sort
    draggedTodo.sort = targetTodo.sort
    targetTodo.sort = tempSort

    // 更新 todos 中对应项的顺序
    const allTodos = todos.value.map((todo) => {
      if (todo.id === draggedTodo.id) {
        return { ...todo, sort: draggedTodo.sort }
      }
      if (todo.id === targetTodo.id) {
        return { ...todo, sort: targetTodo.sort }
      }
      return todo
    })

    // 根据 sort 值重新排序
    todos.value = allTodos.sort((a, b) => a.sort - b.sort)

    // 保存更新后的数据
    await window.api.writeFile(useUser.fileFullPath, JSON.stringify(todos.value))
    $msg({
      type: 'success',
      msg: '任务顺序已更新'
    })
  } catch (error) {
    console.error('更新失败:', error)
    $msg({
      type: 'error',
      msg: '更新失败，请重试'
    })
  }
}

// 监听主窗口显示事件
const handleShowMainWindow = () => {
  fetchData()
}

// 添加按日期分组的计算属性
const groupedTodayTodos = computed(() => {
  const groups = new Map<string, { dateKey: string; title: string; tasks: Todo[] }>()

  todayTodos.value.forEach((todo) => {
    const isToday = isTodoCreatedToday(todo.createdAt)
    const dateKey = isToday ? 'today' : 'yesterday'
    const title = isToday ? '今日任务' : '今日前未完成'

    if (!groups.has(dateKey)) {
      groups.set(dateKey, { dateKey, title, tasks: [] })
    }
    groups.get(dateKey)?.tasks.push(todo)
  })

  // 确保今日任务在前，昨日未完成在后
  const result = []
  if (groups.has('today')) result.push(groups.get('today')!)
  if (groups.has('yesterday')) result.push(groups.get('yesterday')!)

  return result
})

const handleCompleteTodoFromReminder = async (event: any, todoId: number) => {
  try {
    // 在todayTodos中查找对应的todo
    const todoToComplete = todayTodos.value.find((todo) => todo.id === todoId)

    if (todoToComplete && !todoToComplete.completed) {
      // 标记为已完成
      todoToComplete.completed = true
      todoToComplete.completedAt = new Date().toLocaleString()

      // 同步历史数据
      syncHistoryData(todoToComplete)

      // 保存数据
      await window.store.set('todayTodos', JSON.parse(JSON.stringify(todayTodos.value)))
      await window.store.set('historyData', JSON.parse(JSON.stringify(historyData.value)))

      // 更新全选状态
      if (todos.value.length > 0) {
        const allSelected = todos.value.every((todo) => todo.completed)
        selectAll.value = allSelected
      }

      $msg({
        type: 'success',
        msg: '任务已完成'
      })
    }
  } catch (error) {
    console.error('完成任务失败:', error)
    $msg({
      type: 'error',
      msg: '完成任务失败'
    })
  }
}

const handleOutsideClick = () => {
  if (detailVisible.value) {
    hided()
  }
}

const completeAndDelete = async (todo: Todo) => {
  // 先标记为完成
  todo.completed = true
  todo.completedAt = new Date().toLocaleString()

  // 同步历史数据
  syncHistoryData(todo)

  // 如果当前选中的是要删除的todo，关闭详情页
  if (selectedTodo.value && selectedTodo.value.id === todo.id) {
    hided()
  }

  // 标记为删除状态并添加动画
  todo.isRemove = true

  setTimeout(async () => {
    // 从原始todos数组中根据ID删除
    const todoIndex = todos.value.findIndex((t) => t.id === todo.id)
    if (todoIndex !== -1) {
      todos.value.splice(todoIndex, 1)
    }

    // 在historyData中标记为从home页删除
    const historyIndex = historyData.value.findIndex((t) => t.id === todo.id)
    if (historyIndex !== -1) {
      historyData.value[historyIndex].deletedFromHome = true
    }

    // 保存数据
    await window.store.set('todayTodos', JSON.parse(JSON.stringify(todayTodos.value)))
    await window.store.set('historyData', JSON.parse(JSON.stringify(historyData.value)))
  }, 500)
}

onMounted(() => {
  fetchData()
  // 添加事件监听
  window.electron.ipcRenderer.on('main-window-show', handleShowMainWindow)
  // 添加完成todo的事件监听器
  window.electron.ipcRenderer.on('complete-todo-from-reminder', handleCompleteTodoFromReminder)
})

onBeforeUnmount(() => {
  // 移除事件监听
  window.electron.ipcRenderer.removeListener('main-window-show', handleShowMainWindow)
  window.electron.ipcRenderer.removeListener(
    'complete-todo-from-reminder',
    handleCompleteTodoFromReminder
  )
  // 清理详情页面状态，防止切换页面时动画闪烁
  detailVisible.value = false
  detailAnimate.value = false
  selectedTodo.value = null
  textInputVisible.value = false
  inputVisible.value = false
})
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
  align-items: center;
  padding: 10px;
  width: calc(100% - 25px);
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
</style>
