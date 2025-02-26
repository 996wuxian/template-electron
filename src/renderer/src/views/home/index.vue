<template>
  <div class="page p-10px flex flex-1">
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
        <div v-else class="h-[calc(100%-20px)] overflow-y-auto">
          <TodoItem
            v-for="(todo, index) in todayTodos"
            :key="todo.id"
            :todo="todo"
            :index="index"
            :todos="todos"
            :collapsed="collapsed"
            :check-box="true"
            @delete-todo="deleteTodo"
            @toggle-details="toggleDetails"
            @toggle-sub-items-selection="toggleSubItemsSelection"
          />
        </div>
      </div>

      <!-- 全选和批量删除 -->
      <div
        v-if="todayTodos.length > 0"
        class="todo-actions mt-4 flex justify-between items-center mt-auto"
      >
        <n-checkbox v-model:checked="selectAll" @update:checked="toggleSelectAll">
          <div class="flex items-center">
            全选
            <div v-if="!collapsed" class="flex-1">
              已完成 : {{ selected.length }} / 总数量 : {{ todayTodos.length }}
            </div>
          </div>
        </n-checkbox>
        <i
          i-solar-trash-bin-minimalistic-2-linear
          class="w-20px h-20px hover:text-red-500 cursor-pointer"
          @click.stop="deleteSelected"
        ></i>
      </div>
    </div>

    <!-- 右侧区域：Todo 详情 -->
    <div
      class="todo-details border-l border-gray-200 animate__animated overflow-hidden item-transition bg-white shadow-xl"
      :class="[
        detailAnimate ? 'animate__fadeInRight w-[360px] ml-4 p-6' : 'animate__fadeOutRight w-0',
        collapsed ? 'absolute top-0 w-190px h-400px right-0' : ''
      ]"
    >
      <div v-show="detailVisible" class="h-full flex flex-col">
        <!-- 头部区域 -->
        <div class="flex justify-between items-start mb-4 pb-2 border-b border-gray-200">
          <div class="flex-1 flex items-center">
            <h2 class="text-20px font-semibold text-gray-600 truncate">
              {{ selectedTodo?.text }}
            </h2>

            <i
              i-solar-double-alt-arrow-right-line-duotone
              class="w-20px h-20px cursor-pointer hover:text-red-500 ml-auto"
              @click="hideDetails"
            />
          </div>
        </div>

        <!-- 主体内容 -->
        <div class="flex-1 h-100%">
          <!-- 基本信息卡片 -->
          <div class="mb-3 bg-gray-50 rounded-lg">
            <div class="space-y-6">
              <div class="text-gray-600 text-16px">{{ selectedTodo?.text }}</div>
              <div>
                <label class="text-sm font-medium text-gray-500">详细描述</label>

                <div class="mt-1 text-gray-400 flex items-center gap-1">
                  <n-input
                    v-if="inputVisible && selectedTodo"
                    v-model:value="selectedTodo.description"
                    placeholder="输入描述"
                    size="medium"
                    @blur="descChange"
                  />
                  <div v-else class="flex items-center gap-1">
                    <p v-if="selectedTodo?.description" @click="inputVisible = true">
                      {{ selectedTodo?.description }}
                    </p>
                    <div v-else class="flex items-center gap-1">
                      {{ '无附加描述' }}
                      <i i-solar-pen-2-broken @click="editDescription"></i>
                    </div>
                  </div>
                </div>
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

          <!-- 子任务区域 -->
          <div class="border-t pt-4 h-[calc(100%-220px)]">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium flex items-center gap-2">
                <i i-solar-paperclip-bold-duotone class="w-4 h-4 text-blue-500" />
                子任务 ({{ selectedTodo?.subTodos?.length || 0 }})
              </h3>
              <span v-if="!collapsed" class="text-xs text-gray-400">最大支持4级嵌套</span>
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
                  <i class="i-solar-add-circle-line-duotone text-gray-400" />
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
                  class="flex-1 text-gray-700 transition-all"
                  :class="{
                    'line-through text-gray-400': subTodo.completed,
                    'opacity-75 hover:opacity-100': !subTodo.completed
                  }"
                >
                  {{ subTodo.text }}
                </span>
                <i
                  v-if="subTodo.subTodos?.length"
                  class="i-solar-arrow-right-line-duotone ml-2 text-gray-300 group-hover:text-blue-500"
                />
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
import { $msg } from '@renderer/config/interaction.config'
import dayjs from 'dayjs'

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
const detailVisible = ref(false)
const detailAnimate = ref(false)
const inputVisible = ref(false)

const selected = computed(() => todayTodos.value.filter((todo) => todo.completed))
const historyData = ref<Todo[]>([])

// 获取今天创建的所有 todos
const todayTodos = computed(() => {
  return todos.value.filter((todo) => isTodoCreatedToday(todo.createdAt))
})

// 添加 Todo 项
const addTodo = async () => {
  if (!useUser.filePath) {
    $msg({
      type: 'warning',
      msg: '请前往设置记录存放地址'
    })
    return
  }

  if (value.value.trim()) {
    try {
      const newTodo = {
        id: Date.now(),
        text: value.value,
        completed: false,
        isRemove: false,
        createdAt: new Date().toLocaleString(), // 格式化当前时间
        subTodos: [], // 初始化子项为空数组
        level: 1,
        description: ''
      }
      todos.value.push(newTodo)
      historyData.value.push(newTodo)
      value.value = ''

      // 写入内容
      await window.api.writeFile(useUser.fileFullPath, JSON.stringify(todayTodos.value))
      await window.api.writeFile(useUser.historyFullPath, JSON.stringify(historyData.value))
    } catch (error) {
      console.error('保存失败:', error)
    }
  }
}

// 删除 Todo 项
const deleteTodo = (data: any, index: number) => {
  data[index].isRemove = true
  setTimeout(() => {
    data.splice(index, 1)
    window.api.writeFile(useUser.fileFullPath, JSON.stringify(todayTodos.value))
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
      description: ''
    }
    historyData.value.push(newSubTodo)
    selectedTodo.value.subTodos.push(newSubTodo)
    await window.api.writeFile(useUser.fileFullPath, JSON.stringify(todayTodos.value))
    await window.api.writeFile(useUser.historyFullPath, JSON.stringify(historyData.value))
    newSubTodoText.value = ''
  }
}

// 切换全选状态
const toggleSelectAll = () => {
  todos.value.forEach((todo) => {
    todo.completed = selectAll.value
    todo.subTodos.forEach((subTodo) => {
      subTodo.completed = selectAll.value
    })
  })

  window.api.writeFile(useUser.fileFullPath, JSON.stringify(todayTodos.value))
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
    selectAll.value = false // 取消全选
    // 写入内容
    await window.api.writeFile(useUser.fileFullPath, JSON.stringify([]))
  }, 500)

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

  window.api.writeFile(useUser.fileFullPath, JSON.stringify(todayTodos.value))
  if (todos.value.length > 0) {
    const allSelected = todos.value.every((todo) => todo.completed)
    selectAll.value = allSelected
  }
}

const editDescription = () => {
  inputVisible.value = !inputVisible.value
}

const descChange = () => {
  inputVisible.value = false
  window.api.writeFile(useUser.fileFullPath, JSON.stringify(todayTodos.value))
}

// 判断 todo 是否是今天创建的
const isTodoCreatedToday = (createdAt: string) => {
  return dayjs(createdAt).isSame(dayjs(), 'day')
}

onMounted(() => {
  const data = Array.isArray(window.api.readFile(useUser.fileFullPath))
    ? window.api.readFile(useUser.fileFullPath)
    : []
  console.log('🚀 ~ onMounted ~ data:', data)

  historyData.value = Array.isArray(window.api.readFile(useUser.historyFullPath))
    ? window.api.readFile(useUser.historyFullPath)
    : []
  if (data) {
    todos.value = data
    // 检查是否所有项目都被选中
    if (todos.value.length > 0) {
      const allSelected = todos.value.every((todo) => todo.completed)
      selectAll.value = allSelected
    }
  }
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
</style>
