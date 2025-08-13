<template>
  <div class="page p-10px flex flex-1" @click="handleOutsideClick">
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
          <n-collapse
            v-model:expanded-names="expandedNames"
            accordion
            class="animate__animated animate__fadeInDown"
          >
            <n-collapse-item
              v-for="group in groupedTodos"
              :key="group.dateKey"
              :name="group.dateKey"
              class="mb-4"
            >
              <template #header>
                <div class="group-header flex items-center px-2">
                  <div class="flex items-center">
                    <span class="text-14px text-gray-700 max-w-100px line-clamp-1">{{
                      group.title
                    }}</span>
                    <n-tag size="small" :bordered="false" type="info" class="ml-2">
                      {{ group.tasks.length }}项
                    </n-tag>
                  </div>
                </div>
              </template>

              <div class="flex flex-col gap-2 p-2 rounded">
                <TodoItem
                  v-for="(todo, index) in group.tasks"
                  :key="todo.id"
                  :todo="todo"
                  :index="index"
                  :todos="group.tasks"
                  :check-box="false"
                  :collapsed="collapsed"
                  :delete-show="true"
                  :status-show="true"
                  class="hover:bg-white rounded p-2 transition-colors hover:c-#3984F3"
                  @click.stop
                  @delete-todo="deleteTodo"
                  @toggle-details="toggleDetails"
                  @toggle-sub-items-selection="toggleSubItemsSelection"
                />
              </div>

              <template #header-extra>
                <div
                  v-if="!useUser.$state.isRightTop"
                  class="flex items-center justify-between text-gray-400 text-12px"
                >
                  <div class="flex items-center gap-2 mr-5px">
                    <span>完成：{{ getCompletedCount(group.tasks) }}</span>
                    <span>进行中：{{ group.tasks.length - getCompletedCount(group.tasks) }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <i i-solar-clock-circle-bold-duotone />
                    <span>{{ getGroupTimeInfo(group.dateKey) }}</span>
                  </div>
                </div>
              </template>
            </n-collapse-item>
          </n-collapse>
        </div>

        <div v-if="todos.length > 0" class="flex p-4 border-t border-gray-200">
          <n-button type="error" size="medium" :loading="deleteLoading" @click="deleteAllTodos">
            <template #icon>
              <i class="i-solar-trash-bin-minimalistic-2-linear"></i>
            </template>
            全部删除历史记录
          </n-button>
        </div>
      </div>
    </div>

    <!-- 右侧区域：Todo 详情 -->
    <div
      v-if="detailVisible && !collapsed"
      class="todo-details border-l border-gray-200 animate__animated overflow-y-auto item-transition bg-white shadow-xl theme-page absolute top-0 right-0 h-full pr-10px"
      :class="[
        detailAnimate
          ? 'animate__fadeInRight w-[300px] ml-4 p-4 pr-0'
          : 'animate__fadeOutRight w-0',
        collapsed ? 'h-400px' : ''
      ]"
    >
      <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-200 no-drag">
        <h2 class="text-18px text-gray-600 truncate w-full max-w-240px">
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
            <div class="flex justify-end mt-4">
              <n-button type="primary" size="small" @click="addToToday"> 添加到今日待办 </n-button>
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
import { $msg } from '@renderer/config/interaction.config'
import { useDialog } from 'naive-ui'
const dialog = useDialog()

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
  deletedFromHome?: boolean // 标记是否从home页删除
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
const deleteLoading = ref(false)
// 配置 dayjs 插件
dayjs.extend(isToday)
dayjs.extend(isYesterday)

const expandedNames = ref<string[]>([])

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

watch(
  groupedTodos,
  (newGroups) => {
    if (newGroups.length > 0) {
      // 查找今天的分组
      const todayGroup = newGroups.find((group) => group.dateKey === 'today')
      if (todayGroup) {
        expandedNames.value = ['today']
      } else {
        // 如果没有今天的数据，展开第一个分组
        expandedNames.value = [newGroups[0].dateKey]
      }
    }
  },
  { immediate: true }
)

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
const deleteTodo = async (data: any, index: number) => {
  const todoToDelete = data[index]

  // 设置删除动画
  data[index].isRemove = true

  setTimeout(async () => {
    try {
      // 从当前分组数据中删除
      data.splice(index, 1)

      // 从主todos数组中删除
      const todoIndex = todos.value.findIndex((todo) => todo.id === todoToDelete.id)
      if (todoIndex !== -1) {
        todos.value.splice(todoIndex, 1)
      }

      // 更新存储 - 使用新的存储方式
      await window.store.set('historyData', JSON.parse(JSON.stringify(todos.value)))

      console.log('删除成功')
    } catch (error) {
      console.error('删除失败:', error)
      // 如果删除失败，恢复数据
      data[index].isRemove = false
    }
  }, 500)

  // 隐藏详情页
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

const deleteAllTodos = async () => {
  // 二次确认
  const confirmed = await new Promise((resolve) => {
    dialog.warning({
      title: '确认删除',
      content: '确定要删除所有历史记录吗？此操作不可恢复！',
      positiveText: '确定删除',
      negativeText: '取消',
      onPositiveClick: () => {
        resolve(true)
      },
      onNegativeClick: () => {
        resolve(false)
      },
      onClose: () => {
        resolve(false)
      }
    })
  })

  if (!confirmed) {
    return
  }

  try {
    deleteLoading.value = true

    // 清空历史数据
    await window.store.set('historyData', [])

    // 清空当前显示的数据
    todos.value = []

    // 隐藏详情页
    hided()

    $msg({
      type: 'success',
      msg: '已清空所有历史记录'
    })
  } catch (error) {
    console.error('删除失败:', error)
    $msg({
      type: 'error',
      msg: '删除失败'
    })
  } finally {
    deleteLoading.value = false
  }
}

const handleOutsideClick = () => {
  if (detailVisible.value) {
    hided()
  }
}

onMounted(async () => {
  // 读取文件内容
  const data = await window.store.get('historyData')
  console.log('🚀 ~ onMounted ~ data:', data)
  if (data) {
    todos.value = data.map((item: any) => {
      return {
        ...item,
        isRemove: false
      }
    })
  }
})

onBeforeUnmount(() => {
  // 清理详情页面状态，防止切换页面时动画闪烁
  detailVisible.value = false
  detailAnimate.value = false
  selectedTodo.value = null
  inputVisible.value = false
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

// 添加到今日待办
const addToToday = async () => {
  if (!selectedTodo.value) return

  try {
    // 使用新的存储方式读取当前的待办列表
    const currentTodos = await window.store.get('todayTodos', [])

    // 检查今日是否已存在相同的待办（根据文本内容判断）
    const existingTodo = currentTodos.find(
      (todo: any) => todo.text.trim() === selectedTodo.value!.text.trim()
    )

    if (existingTodo) {
      $msg({
        type: 'warning',
        msg: '今日已存在该待办项'
      })
      return
    }

    // 创建新的待办项
    const newTodo = {
      ...selectedTodo.value,
      id: Date.now(), // 生成新的 ID
      createdAt: new Date().toLocaleString(), // 更新创建时间为当前时间
      completed: false, // 重置完成状态
      isRemove: false,
      sort: currentTodos.length, // 添加到末尾
      reminderTime: undefined, // 重置提醒时间
      reminderEnabled: false, // 重置提醒开关
      deletedFromHome: false // 确保不被标记为删除
    }

    // 添加到待办列表
    const updatedTodos = [...currentTodos, newTodo]

    // 使用新的存储方式保存
    await window.store.set('todayTodos', JSON.parse(JSON.stringify(updatedTodos)))

    $msg({
      type: 'success',
      msg: '已添加到今日待办'
    })
  } catch (error) {
    console.error('添加失败:', error)
    $msg({
      type: 'error',
      msg: '添加失败'
    })
  }
}
</script>

<style lang="scss" scoped>
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

:deep(.n-collapse-item__content-wrapper) {
  .n-collapse-item__content-inner {
    padding-top: 0 !important;
  }
}
</style>
