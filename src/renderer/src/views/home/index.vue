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
        <div v-else class="h-[calc(100%-20px)] overflow-y-auto w-100%">
          <div class="h-[calc(100%-20px)] overflow-y-auto w-100%">
            <!-- 按日期分组显示 -->
            <div v-for="group in groupedTodayTodos" :key="group.dateKey" class="mb-4">
              <!-- 分组标题 -->
              <div v-if="group.dateKey !== 'today'" class="flex items-center gap-2 mb-2 px-2">
                <i class="i-solar-clock-circle-bold-duotone text-orange-500"></i>
                <span class="text-14px font-600 text-orange-600">{{ group.title }}</span>
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
                  :todos="todos"
                  :collapsed="collapsed"
                  :check-box="true"
                  :delete-show="true"
                  :status-show="true"
                  @delete-todo="deleteTodo"
                  @toggle-details="toggleDetails"
                  @toggle-sub-items-selection="toggleSubItemsSelection"
                />
              </VueDraggable>
            </div>
          </div>
          <!-- <VueDraggable
            ref="el"
            v-model="todayTodos"
            :animation="150"
            style="width: 100%; background-color: transparent"
            class="flex flex-col gap-2 p-4 w-300px h-300px m-auto bg-gray-500/5 rounded"
            @start="onStart"
            @end="onEnd"
          >
            <TodoItem
              v-for="(todo, index) in todayTodos"
              :key="todo.id"
              :todo="todo"
              :index="index"
              :todos="todos"
              :collapsed="collapsed"
              :check-box="true"
              :delete-show="true"
              :status-show="true"
              style="width: 100%"
              @delete-todo="deleteTodo"
              @toggle-details="toggleDetails"
              @toggle-sub-items-selection="toggleSubItemsSelection"
            />
          </VueDraggable> -->
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
      class="todo-details border-l border-gray-200 animate__animated overflow-y-auto item-transition bg-white shadow-xl theme-page absolute top-0 right-0 w-240px h-full"
      :class="[
        detailAnimate ? 'animate__fadeInRight w-[360px] ml-4 p-4' : 'animate__fadeOutRight w-0',
        collapsed ? 'h-400px' : ''
      ]"
    >
      <div v-show="detailVisible" class="h-full flex flex-col">
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
        <div class="flex-1 h-[calc(100%-200px)] overflow-y-auto">
          <!-- 基本信息卡片 -->
          <div class="mb-3 bg-gray-50 rounded-lg">
            <div class="space-y-4 theme-page">
              <!-- 修改这部分 -->
              <div class="text-gray-600 text-14px">
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
                <label class="text-sm font-medium text-gray-500">详细描述</label>

                <div class="mt-1 text-gray-400 flex items-center gap-1">
                  <n-input
                    v-if="inputVisible && selectedTodo"
                    v-model:value="selectedTodo.description"
                    placeholder="输入描述"
                    size="medium"
                    @blur="descChange"
                  />
                  <div v-else class="flex items-center gap-1 text-13px">
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
                <span class="text-sm font-medium text-gray-500 flex items-center gap-1 flex-1">
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
          <div class="border-t pt-4 h-[calc(100%-250px)]">
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
                  class="flex-1 text-gray-500 transition-all"
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import useThemeStore from '@renderer/stores/modules/theme'
import useUserStore from '@renderer/stores/modules/user'
import TodoItem from '@renderer/components/common/TodoItem.vue'
import { $msg } from '@renderer/config/interaction.config'
import dayjs from 'dayjs'
import { type DraggableEvent, type UseDraggableReturn, VueDraggable } from 'vue-draggable-plus'

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
const el = ref<UseDraggableReturn>()

const selected = computed(() => todayTodos.value.filter((todo) => todo.completed))
const historyData = ref<Todo[]>([])

const todayTodos = computed(() => {
  return todos.value.filter((todo) => {
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
        createdAt: new Date().toLocaleString(),
        subTodos: [],
        level: 1,
        description: '',
        status: 4,
        sort: todos.value.length,
        completedAt: ''
      }

      // 读取当前的历史数据
      const currentHistoryData = Array.isArray(window.api.readFile(useUser.historyFullPath))
        ? window.api.readFile(useUser.historyFullPath)
        : []

      // 将新的待办添加到历史数据中
      const updatedHistoryData = [...currentHistoryData, newTodo]

      // 更新本地数据
      todos.value.push(newTodo)
      historyData.value = updatedHistoryData
      value.value = ''

      // 写入文件
      await window.api.writeFile(useUser.fileFullPath, JSON.stringify(todayTodos.value))
      await window.api.writeFile(useUser.historyFullPath, JSON.stringify(updatedHistoryData))
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
      description: '',
      status: 4,
      sort: selectedTodo.value.subTodos.length,
      completedAt: ''
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

  // 更新当前 todo 的所有子项状态
  updateSubTodosStatus(todo.subTodos)

  // 更新 historyData 中对应的 todo 及其子项状态
  const updateHistoryTodoStatus = (todoId: number) => {
    const historyTodo = historyData.value.find((item) => item.id === todoId)
    if (historyTodo) {
      historyTodo.completed = isSelected
      // 如果有子项，也需要更新子项状态
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

  // 保存更新后的数据
  const currentHistoryData = Array.isArray(window.api.readFile(useUser.historyFullPath))
    ? window.api.readFile(useUser.historyFullPath)
    : []

  // 更新历史数据中的对应项
  const updatedHistoryData = currentHistoryData.map((item: Todo) => {
    if (item.id === todo.id) {
      return {
        ...item,
        completed: isSelected,
        subTodos: todo.subTodos
      }
    }
    return item
  })

  await window.api.writeFile(useUser.fileFullPath, JSON.stringify(todayTodos.value))
  await window.api.writeFile(useUser.historyFullPath, JSON.stringify(updatedHistoryData))

  // 更新全选状态
  if (todos.value.length > 0) {
    const allSelected = todos.value.every((todo) => todo.completed)
    selectAll.value = allSelected
  }
}

const editDescription = () => {
  inputVisible.value = !inputVisible.value
}

const saveTodo = () => {
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
  }

  window.api.writeFile(useUser.fileFullPath, JSON.stringify(todayTodos.value))
}

const textInputVisible = ref(false)

// 添加编辑文本的方法
const editText = () => {
  textInputVisible.value = true
}

// 添加文本修改完成的方法
const textChange = () => {
  textInputVisible.value = false
  saveTodo()
}

const descChange = () => {
  inputVisible.value = false
  saveTodo()
}

// 判断 todo 是否是今天创建的
const isTodoCreatedToday = (createdAt: string) => {
  return dayjs(createdAt).isSame(dayjs(), 'day')
}

// 添加获取数据的方法
const fetchData = () => {
  // 读取今日待办文件
  const todayData = Array.isArray(window.api.readFile(useUser.fileFullPath))
    ? window.api.readFile(useUser.fileFullPath)
    : []

  // 读取历史待办文件
  const historyData = Array.isArray(window.api.readFile(useUser.historyFullPath))
    ? window.api.readFile(useUser.historyFullPath)
    : []

  // 获取历史未完成任务，但排除今天已经添加到 todayData 中的任务
  const uncompletedHistoryTodos = historyData.filter((todo: Todo) => {
    const isHistoryTodo = !isTodoCreatedToday(todo.createdAt)
    const isUncompleted = !todo.completed
    const notInTodayData = !todayData.some((t: Todo) => t.id === todo.id)
    return isHistoryTodo && isUncompleted && notInTodayData
  })

  // 合并数据：今天的所有任务 + 未重复的历史未完成任务
  const mergedData = [...todayData, ...uncompletedHistoryTodos]

  if (mergedData.length > 0) {
    // 确保所有项都有 sort 值
    mergedData.forEach((todo: Todo, index: number) => {
      if (typeof todo.sort === 'undefined') {
        todo.sort = index
      }
    })
    // 根据 sort 值排序
    todos.value = mergedData.sort((a: Todo, b: Todo) => a.sort - b.sort)
    // 检查是否所有项目都被选中
    const allSelected = todos.value.every((todo) => todo.completed)
    selectAll.value = allSelected
  } else {
    todos.value = []
    selectAll.value = false
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
    const title = isToday ? '今日任务' : '昨日未完成'

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

onMounted(() => {
  fetchData()
  // 添加事件监听
  window.electron.ipcRenderer.on('main-window-show', handleShowMainWindow)
})

onBeforeUnmount(() => {
  // 移除事件监听
  window.electron.ipcRenderer.removeListener('main-window-show', handleShowMainWindow)
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
