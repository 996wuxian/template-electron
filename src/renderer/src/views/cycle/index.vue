<template>
  <div class="page p-10px flex flex-1 flex-col theme-page">
    <!-- 头部操作区域 -->
    <div class="flex items-center justify-between mb-6 compact-header">
      <div class="flex items-center gap-2">
        <n-button type="primary" size="small" @click="openAddCycleModal">
          <template #icon>
            <i class="i-solar-add-circle-bold-duotone"></i>
          </template>
          <span class="hidden-in-small ml-5px">设置周期待办</span>
        </n-button>
        <n-button type="error" size="small" @click="showDeleteConfirmModal = true">
          <template #icon>
            <i class="i-solar-trash-bin-minimalistic-2-bold-duotone"></i>
          </template>
          <span class="hidden-in-small ml-5px">删除周期待办</span>
        </n-button>
        <n-tag type="info" size="small" class="hidden-in-small">
          {{ currentYear }}年 {{ currentMonth }}月
        </n-tag>
      </div>

      <!-- 月份切换 -->
      <div class="flex items-center gap-1">
        <n-button size="small" circle @click="previousMonth">
          <template #icon>
            <i class="i-solar-alt-arrow-left-line-duotone"></i>
          </template>
        </n-button>
        <span class="text-12px font-600 min-w-80px text-center compact-month-text">
          {{ currentYear }}年{{ currentMonth }}月
        </span>
        <n-button size="small" circle @click="nextMonth">
          <template #icon>
            <i class="i-solar-alt-arrow-right-line-duotone"></i>
          </template>
        </n-button>
      </div>
    </div>

    <!-- 日历视图 -->
    <n-scrollbar class="calendar-container pb-20px flex-1">
      <div
        v-for="week in monthWeeks"
        :key="week.weekNumber"
        class="week-container mb-2"
        :class="themeType === 'dark' ? 'bg-#1f2422 border border-#2f3330' : 'bg-#fafafa'"
      >
        <div class="week-header flex items-center gap-2 mb-2">
          <i class="i-solar-calendar-bold-duotone text-blue-500 text-12px"></i>
          <span
            class="text-10px font-600 compact-week-text"
            :class="themeType === 'dark' ? 'text-gray-300' : 'text-gray-600'"
          >
            第{{ week.weekNumber }}周 ({{ formatWeekRange(week.days) }})
          </span>
        </div>

        <div class="week-days grid grid-cols-7 gap-1">
          <div
            v-for="day in week.days"
            :key="day.date"
            class="day-cell border rounded-lg p-1 cursor-pointer transition-all hover:shadow-md compact-day-cell"
            :class="[
              themeType === 'dark'
                ? day.isToday
                  ? 'bg-blue-900/30 border-blue-700'
                  : day.isCurrentMonth
                    ? 'bg-#1f2422 border-#2f3330'
                    : 'bg-#161a18 border-#2a2e2b'
                : day.isToday
                  ? 'bg-blue-50 border-blue-200'
                  : day.isCurrentMonth
                    ? 'bg-white border-gray-200'
                    : 'bg-gray-50'
            ]"
            @click="openDayModal(day)"
          >
            <div class="day-header flex items-center justify-between mb-1">
              <span
                class="text-10px font-600"
                :class="[
                  day.isToday ? (themeType === 'dark' ? 'text-blue-400' : 'text-blue-600') : '',
                  !day.isCurrentMonth
                    ? themeType === 'dark'
                      ? 'text-gray-500'
                      : 'text-gray-400'
                    : '',
                  day.isCurrentMonth && !day.isToday
                    ? themeType === 'dark'
                      ? 'text-gray-200'
                      : 'text-gray-700'
                    : ''
                ]"
              >
                {{ day.dayNumber }}
              </span>
              <span
                class="text-8px compact-day-name"
                :class="themeType === 'dark' ? 'text-gray-500' : 'text-gray-400'"
              >
                {{ getDayName(day.dayOfWeek) }}
              </span>
            </div>

            <!-- 当日待办预览 -->
            <div class="space-y-1">
              <div
                v-for="todo in getDayTodos(day)"
                :key="todo.id"
                class="text-8px p-1 rounded truncate compact-todo-item"
                :class="[
                  todo.completed
                    ? themeType === 'dark'
                      ? 'bg-green-900/40 text-green-300 line-through'
                      : 'bg-green-100 text-green-700 line-through'
                    : themeType === 'dark'
                      ? 'bg-orange-900/40 text-orange-300'
                      : 'bg-orange-100 text-orange-700'
                ]"
              >
                {{ todo.text }}
              </div>
              <div
                v-if="getDayTodos(day).length === 0"
                class="text-8px"
                :class="themeType === 'dark' ? 'text-gray-500' : 'text-gray-400'"
              >
                无
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-scrollbar>

    <!-- 新增周期待办弹窗 -->
    <n-modal
      v-model:show="showAddCycleModal"
      preset="dialog"
      :show-icon="false"
      title="设置周期待办"
      size="small"
      class="no-drag"
    >
      <div class="space-y-4">
        <div
          class="text-12px mb-4"
          :class="themeType === 'dark' ? 'text-gray-300' : 'text-gray-600'"
        >
          为每个工作日设置重复的待办事项，这些待办将自动应用到每周的对应日期。
        </div>
        <n-scrollbar class="max-h-400px">
          <div
            v-for="(dayName, index) in weekDays"
            :key="index"
            class="day-section"
            :class="
              themeType === 'dark' ? 'border-#2f3330 bg-#1b1f1d' : 'border-#e5e7eb bg-#f9fafb'
            "
          >
            <div class="flex items-center gap-2 mb-2">
              <i class="i-solar-calendar-date-bold-duotone text-[#4BBBC1]"></i>
              <span class="text-14px font-600">{{ dayName }}</span>
              <n-button size="tiny" @click="addTodoForDay(index)">
                <template #icon>
                  <i class="i-solar-add-circle-line-duotone"></i>
                </template>
                添加
              </n-button>
            </div>

            <div class="ml-6">
              <div
                v-for="(todo, todoIndex) in cycleTodos[index]"
                :key="todoIndex"
                class="flex items-center gap-2 p-2 rounded"
                :class="themeType === 'dark' ? 'bg-#242a27' : 'bg-gray-50'"
              >
                <n-input
                  v-model:value="todo.text"
                  placeholder="输入待办内容"
                  size="small"
                  class="flex-1"
                />
                <n-select
                  v-model:value="todo.status"
                  size="small"
                  class="w-80px"
                  :options="priorityOptions"
                />
                <n-button size="tiny" type="error" @click="removeTodoForDay(index, todoIndex)">
                  <template #icon>
                    <i class="i-solar-trash-bin-minimalistic-line-duotone"></i>
                  </template>
                </n-button>
              </div>
            </div>
          </div>
        </n-scrollbar>
      </div>

      <template #action>
        <div class="flex gap-2">
          <n-button @click="showAddCycleModal = false">取消</n-button>
          <n-button type="primary" @click="saveCycleTodos">确认</n-button>
        </div>
      </template>
    </n-modal>

    <!-- 每日待办弹窗 -->
    <n-modal
      v-model:show="showDayModal"
      preset="dialog"
      :show-icon="false"
      :title="dayModalTitle"
      size="small"
    >
      <div class="space-y-4">
        <div class="text-14px" :class="themeType === 'dark' ? 'text-gray-200' : 'text-gray-600'">
          {{ selectedDay?.date }} 的待办事项
        </div>

        <n-scrollbar class="space-y-2 max-h-400px">
          <div
            v-for="todo in selectedDayTodos"
            :key="todo.id"
            class="flex items-center gap-3 p-3 border rounded-lg"
            :class="[
              todo.completed
                ? themeType === 'dark'
                  ? 'bg-green-900/30 border-green-700'
                  : 'bg-green-50 border-green-200'
                : themeType === 'dark'
                  ? 'bg-#1f2422 border-#2f3330'
                  : 'bg-white border-gray-200'
            ]"
          >
            <n-checkbox v-model:checked="todo.completed" @update:checked="updateTodoStatus(todo)" />
            <div class="flex-1">
              <div
                class="text-14px"
                :class="[
                  todo.completed
                    ? themeType === 'dark'
                      ? 'line-through text-gray-400'
                      : 'line-through text-gray-500'
                    : themeType === 'dark'
                      ? 'text-gray-200'
                      : 'text-gray-700'
                ]"
              >
                {{ todo.text }}
              </div>
              <div
                class="text-12px mt-1"
                :class="themeType === 'dark' ? 'text-gray-400' : 'text-gray-400'"
              >
                优先级: {{ getPriorityLabel(todo.status) }}
              </div>
            </div>
            <n-tag size="small" :type="todo.completed ? 'success' : getPriorityType(todo.status)">
              {{ todo.completed ? '已完成' : '待完成' }}
            </n-tag>
          </div>
        </n-scrollbar>

        <div
          v-if="selectedDayTodos.length === 0"
          class="text-center py-8"
          :class="themeType === 'dark' ? 'text-gray-400' : 'text-gray-400'"
        >
          <i class="i-solar-clipboard-list-bold-duotone text-48px mb-2"></i>
          <div>今天暂无待办事项</div>
        </div>
      </div>
    </n-modal>

    <n-modal
      v-model:show="showDeleteConfirmModal"
      preset="dialog"
      title="删除周期待办"
      type="warning"
    >
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <i class="i-solar-danger-triangle-bold-duotone text-orange-500 text-24px"></i>
          <div>
            <div class="text-16px font-600 text-gray-800 mb-2">确认删除所有周期待办？</div>
            <div class="text-14px text-gray-600">
              此操作将删除所有已设置的周期待办模板和生成的待办事项，且无法恢复。
            </div>
          </div>
        </div>

        <div class="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div class="text-12px text-orange-700">
            <div class="font-600 mb-1">删除内容包括：</div>
            <ul class="list-disc list-inside space-y-1">
              <li>所有周期待办模板设置</li>
              <li>当前年份所有生成的周期待办事项</li>
              <li>已完成和未完成的周期待办记录</li>
            </ul>
          </div>
        </div>
      </div>

      <template #action>
        <div class="flex gap-2">
          <n-button @click="showDeleteConfirmModal = false">取消</n-button>
          <n-button type="error" @click="deleteCycleTodos">确认删除</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import useThemeStore from '@renderer/stores/modules/theme'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(weekOfYear)
dayjs.extend(isoWeek)

// 定义周期待办接口
interface CycleTodo {
  id: number
  text: string
  status: number // 1-紧急, 2-有点急, 3-一般急, 4-不急
  dayOfWeek: number // 0-6 (周日到周六)
  completed: boolean
  date: string // 具体日期
  createdAt: string
}

// 定义周期模板接口
interface CycleTemplate {
  id: number
  text: string
  status: number
  dayOfWeek: number
}

// 定义日期接口
interface DayInfo {
  date: string
  dayNumber: number
  dayOfWeek: number
  isCurrentMonth: boolean
  isToday: boolean
}

// 定义周接口
interface WeekInfo {
  weekNumber: number
  days: DayInfo[]
}

// 响应式数据
const currentDate = ref(dayjs())
const showAddCycleModal = ref(false)
const showDayModal = ref(false)
const showDeleteConfirmModal = ref(false)
const selectedDay = ref<DayInfo | null>(null)
const cycleTodos = ref<CycleTodo[][]>(Array.from({ length: 7 }, () => []))
const allCycleTodos = ref<CycleTodo[]>([])
const useTheme = useThemeStore()
const themeType = computed(() => useTheme.$state.themeType)

// 工作日名称
const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 优先级选项
const priorityOptions = [
  { label: '紧急', value: 1 },
  { label: '有点急', value: 2 },
  { label: '一般急', value: 3 },
  { label: '不急', value: 4 }
]

// 计算属性
const currentYear = computed(() => currentDate.value.year())
const currentMonth = computed(() => currentDate.value.month() + 1)

const monthWeeks = computed(() => {
  const startOfMonth = currentDate.value.startOf('month')
  const endOfMonth = currentDate.value.endOf('month')
  const startOfCalendar = startOfMonth.startOf('week')
  const endOfCalendar = endOfMonth.endOf('week')

  const weeks: WeekInfo[] = []
  let currentWeekStart = startOfCalendar

  while (currentWeekStart.isBefore(endOfCalendar) || currentWeekStart.isSame(endOfCalendar)) {
    const days: DayInfo[] = []

    for (let i = 0; i < 7; i++) {
      const day = currentWeekStart.add(i, 'day')
      days.push({
        date: day.format('YYYY-MM-DD'),
        dayNumber: day.date(),
        dayOfWeek: day.day(),
        isCurrentMonth: day.month() === currentDate.value.month(),
        isToday: day.isSame(dayjs(), 'day')
      })
    }

    weeks.push({
      weekNumber: currentWeekStart.week(),
      days
    })

    currentWeekStart = currentWeekStart.add(1, 'week')
  }

  return weeks
})

const selectedDayTodos = computed(() => {
  if (!selectedDay.value) return []
  return allCycleTodos.value.filter((todo) => todo.date === selectedDay.value?.date)
})

const dayModalTitle = computed(() => {
  if (!selectedDay.value) return ''
  const date = dayjs(selectedDay.value.date)
  return `${date.format('YYYY年MM月DD日')} ${getDayName(selectedDay.value.dayOfWeek)}`
})

// 方法
const previousMonth = () => {
  currentDate.value = currentDate.value.subtract(1, 'month')
}

const nextMonth = () => {
  currentDate.value = currentDate.value.add(1, 'month')
}

const getDayName = (dayOfWeek: number) => {
  return dayNames[dayOfWeek]
}

const formatWeekRange = (days: DayInfo[]) => {
  const start = days[0]
  const end = days[6]
  return `${start.dayNumber}日 - ${end.dayNumber}日`
}

// 修改：打开设置弹窗时加载已有模板
const openAddCycleModal = async () => {
  await loadCycleTemplates()
  showAddCycleModal.value = true
}

const addTodoForDay = (dayIndex: number) => {
  cycleTodos.value[dayIndex].push({
    id: Date.now() + Math.random(),
    text: '',
    status: 4,
    dayOfWeek: dayIndex === 6 ? 0 : dayIndex + 1, // 转换为dayjs的周日=0格式
    completed: false,
    date: '',
    createdAt: new Date().toISOString()
  })
}

const removeTodoForDay = (dayIndex: number, todoIndex: number) => {
  cycleTodos.value[dayIndex].splice(todoIndex, 1)
}

// 新增：删除所有周期待办
const deleteCycleTodos = async () => {
  try {
    // 清空所有数据
    cycleTodos.value = Array.from({ length: 7 }, () => [])
    allCycleTodos.value = []

    // 删除本地存储的数据
    await window.store.set('cycleTemplates', [])
    await window.store.set('cycleTodos', [])

    // 关闭确认弹窗
    showDeleteConfirmModal.value = false

    // 可以添加成功提示
    console.log('周期待办已全部删除')
  } catch (error) {
    console.error('删除周期待办失败:', error)
  }
}

// 新增：加载周期模板
const loadCycleTemplates = async () => {
  try {
    const savedTemplates = await window.store.get('cycleTemplates', [])

    // 重置cycleTodos数组
    cycleTodos.value = Array.from({ length: 7 }, () => [])

    // 将保存的模板转换为cycleTodos格式
    savedTemplates.forEach((template: CycleTemplate) => {
      const dayIndex = template.dayOfWeek === 0 ? 6 : template.dayOfWeek - 1
      cycleTodos.value[dayIndex].push({
        id: template.id,
        text: template.text,
        status: template.status,
        dayOfWeek: template.dayOfWeek,
        completed: false,
        date: '',
        createdAt: new Date().toISOString()
      })
    })
  } catch (error) {
    console.error('加载周期模板失败:', error)
  }
}

// 新增：保存周期模板
const saveCycleTemplates = async () => {
  const templates: CycleTemplate[] = []

  cycleTodos.value.forEach((dayTodos) => {
    dayTodos.forEach((todo) => {
      if (todo.text.trim()) {
        templates.push({
          id: todo.id,
          text: todo.text,
          status: todo.status,
          dayOfWeek: todo.dayOfWeek
        })
      }
    })
  })

  await window.store.set('cycleTemplates', JSON.parse(JSON.stringify(templates)))
}

const saveCycleTodos = async () => {
  // 先保存模板
  await saveCycleTemplates()

  // 生成当前年份的所有周期待办
  const newCycleTodos: CycleTodo[] = []
  const startOfYear = dayjs().startOf('year')
  const endOfYear = dayjs().endOf('year')

  let currentDate = startOfYear
  while (currentDate.isBefore(endOfYear) || currentDate.isSame(endOfYear)) {
    const dayOfWeek = currentDate.day()
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 转换为数组索引

    cycleTodos.value[dayIndex].forEach((template) => {
      if (template.text.trim()) {
        newCycleTodos.push({
          ...template,
          id: Date.now() + Math.random(),
          date: currentDate.format('YYYY-MM-DD'),
          completed: false
        })
      }
    })

    currentDate = currentDate.add(1, 'day')
  }

  allCycleTodos.value = newCycleTodos

  // 保存到本地存储
  await window.store.set('cycleTodos', JSON.parse(JSON.stringify(allCycleTodos.value)))

  showAddCycleModal.value = false
}

const getDayTodos = (day: DayInfo) => {
  return allCycleTodos.value.filter((todo) => todo.date === day.date).slice(0, 4) // 最多显示3个
}

const openDayModal = (day: DayInfo) => {
  selectedDay.value = day
  showDayModal.value = true
}

const updateTodoStatus = async (todo: CycleTodo) => {
  const index = allCycleTodos.value.findIndex((t) => t.id === todo.id)
  if (index !== -1) {
    allCycleTodos.value[index] = { ...todo }
    await window.store.set('cycleTodos', JSON.parse(JSON.stringify(allCycleTodos.value)))
  }
}

const getPriorityLabel = (status: number) => {
  const option = priorityOptions.find((opt) => opt.value === status)
  return option?.label || '不急'
}

const getPriorityType = (status: number) => {
  switch (status) {
    case 1:
      return 'error'
    case 2:
      return 'warning'
    case 3:
      return 'info'
    default:
      return 'success'
  }
}

// 加载数据
const loadData = async () => {
  try {
    const savedTodos = await window.store.get('cycleTodos', [])
    allCycleTodos.value = savedTodos
  } catch (error) {
    console.error('加载周期待办失败:', error)
  }
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.calendar-container {
  max-height: calc(100vh - 120px);
}

:deep(.n-button__icon) {
  margin: 0;
}

/* 小窗口适配样式 */
@media (max-width: 400px), (max-height: 400px) {
  .calendar-container {
    max-height: calc(100vh - 80px);
  }

  .compact-header {
    margin-bottom: 8px !important;
  }

  .hidden-in-small {
    display: none;
  }

  .compact-month-text {
    font-size: 10px !important;
    min-width: 60px !important;
  }

  .compact-week-text {
    font-size: 8px !important;
  }

  .compact-day-name {
    font-size: 6px !important;
  }

  .compact-day-cell {
    min-height: 40px !important;
    padding: 2px !important;
  }

  .compact-todo-item {
    font-size: 6px !important;
    padding: 1px !important;
  }

  .week-container {
    padding: 8px !important;
    margin-bottom: 4px !important;
  }
}

/* 固定窗口模式特殊适配 */
.page {
  min-height: 100vh;
}

.day-cell {
  transition: all 0.2s ease;
  min-height: 120px;
}

.day-cell:hover {
  transform: translateY(-2px);
}

.week-container {
  border-radius: 8px;
  padding: 16px;
}

.day-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

/* 响应式布局优化 */
@media (max-width: 350px) {
  .week-days {
    gap: 1px !important;
  }

  .compact-day-cell {
    min-height: 30px !important;
    padding: 1px !important;
  }

  .day-header {
    margin-bottom: 0 !important;
  }
}
</style>
