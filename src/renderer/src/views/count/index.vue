<template>
  <div class="p-10px flex flex-col gap-4 overflow-auto h-full">
    <!-- 日历部分 -->
    <n-card size="small" class="calendar-card max-h-360px overflow-auto">
      <n-calendar
        :value="selectedDate"
        :is-date-disabled="isDateDisabled"
        #="{ year, month, date }"
        size="small"
      >
        <div class="w-full h-full text-14px text-center color-#71C9CE">
          {{ getTodoCount(year, month, date) || '-' }}
        </div>
      </n-calendar>
    </n-card>

    <!-- 热力图部分 -->
    <n-card title="活跃度统计" size="small">
      <div class="contribution-graph">
        <!-- 月份标题 -->
        <div class="months-header">
          <div v-for="month in visibleMonths" :key="month" class="month-label">
            {{ month }}
          </div>
        </div>

        <!-- 星期标签 -->
        <div class="weekdays">
          <span>周一</span>
          <span>周三</span>
          <span>周五</span>
        </div>

        <!-- 热力图网格 -->
        <div class="grid-container">
          <div v-for="(week, weekIndex) in contributionData" :key="weekIndex" class="week-column">
            <n-tooltip v-for="(day, dayIndex) in week" :key="dayIndex" trigger="hover">
              <template #trigger>
                <div class="day-cell" :class="getActivityClass(day.count)"></div>
              </template>
              {{ day.date }}: {{ day.count }}次提交
            </n-tooltip>
          </div>
        </div>

        <!-- 图例 -->
        <div class="legend">
          <span>活跃度：</span>
          <div class="legend-items">
            <div class="day-cell activity-0"></div>
            <div class="day-cell activity-1"></div>
            <div class="day-cell activity-2"></div>
            <div class="day-cell activity-3"></div>
            <div class="day-cell activity-4"></div>
          </div>
          <span class="legend-text">少</span>
          <span class="legend-text">多</span>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import useUserStore from '@renderer/stores/modules/user'
import dayjs from 'dayjs'

const useUser = useUserStore()
const todos = ref<any[]>([])
const selectedDate = ref(dayjs(Date.now()).valueOf())
const visibleMonths = computed(() => {
  const startDate = contributionData.value[0]?.[0]?.date
  const endDate = contributionData.value[contributionData.value.length - 1]?.[0]?.date

  if (!startDate || !endDate) return []

  const start = dayjs(startDate)
  const end = dayjs(endDate)
  const monthsArray = []

  let current = start.startOf('month')
  while (current.isBefore(end) || current.isSame(end, 'month')) {
    monthsArray.push(current.format('M月'))
    current = current.add(1, 'month')
  }

  return monthsArray
})

// 生成过去一年的贡献数据
const contributionData = computed(() => {
  const weeks = []
  const endDate = dayjs()
  // 计算开始日期：从去年今天开始，如果不是周一则推到下个周一
  let startDate = endDate.subtract(1, 'year')
  const dayOfWeek = startDate.day()
  if (dayOfWeek !== 1) {
    // 如果不是周一
    startDate = startDate.add(8 - dayOfWeek, 'day') // 推到下个周一
  }

  // 计算总天数
  const totalDays = endDate.diff(startDate, 'day')
  const totalWeeks = Math.ceil(totalDays / 7)

  // 初始化数据结构
  for (let week = 0; week < totalWeeks; week++) {
    const weekData = []
    for (let day = 0; day < 7; day++) {
      const currentDate = startDate.add(week * 7 + day, 'day')
      // 如果超过今天，就不再添加数据
      if (currentDate.isAfter(endDate)) {
        break
      }
      weekData.push({
        date: currentDate.format('YYYY/MM/DD'),
        count: getTodoCountByDate(currentDate),
        dayOfWeek: day
      })
    }
    if (weekData.length > 0) {
      // 只添加有数据的周
      weeks.push(weekData)
    }
  }
  return weeks
})

// 获取指定日期的任务数量
const getTodoCountByDate = (date: dayjs.Dayjs) => {
  const dateStr = date.format('YYYY/M/D')
  return dailyTodos.value.get(dateStr)?.total || 0
}

// 根据活跃度返回对应的类名
const getActivityClass = (count: number) => {
  if (count === 0) return 'activity-0'
  if (count <= 2) return 'activity-1'
  if (count <= 5) return 'activity-2'
  if (count <= 8) return 'activity-3'
  return 'activity-4'
}

// 获取每日任务数据
const dailyTodos = computed(() => {
  const todoMap = new Map()

  todos.value.forEach((todo) => {
    // 直接使用原始日期格式
    const date = todo.createdAt.split(' ')[0]
    if (!todoMap.has(date)) {
      todoMap.set(date, {
        total: 0,
        completed: 0
      })
    }
    const stats = todoMap.get(date)
    stats.total++
    if (todo.subTodos) {
      stats.total += todo.subTodos.length
    }
    if (todo.completed) {
      stats.completed++
    }
    if (todo.subTodos) {
      todo.subTodos.forEach((subTodo: any) => {
        if (subTodo.completed) {
          stats.completed++
        }
      })
    }
  })

  return todoMap
})

// 获取日期的任务数量
const getTodoCount = (year: number, month: number, date: number) => {
  const dateStr = `${year}/${month}/${date}`
  let count = 0

  todos.value.forEach((todo) => {
    // 使用 split 获取日期部分进行比较
    const todoDate = todo.createdAt.split(' ')[0]
    if (todoDate === dateStr) {
      count++
      if (todo.subTodos) {
        count += todo.subTodos.length
      }
    }
  })

  return count || '-'
}

// 禁用未来日期
const isDateDisabled = (timestamp: number) => {
  return timestamp > Date.now()
}

onMounted(() => {
  // 读取文件内容
  const data = window.api.readFile(useUser.historyFullPath)
  if (data) {
    todos.value = data
  }
})
</script>

<style scoped lang="scss">
.calendar-card {
  :deep(.n-calendar) {
    height: 100%;
  }
}

.contribution-graph {
  position: relative;

  .months-header {
    display: flex;
    padding-left: 30px;
    margin-bottom: 10px;
    font-size: 12px;
    color: #666;

    .month-label {
      width: 49px; // 固定宽度，与下方格子对应
      text-align: center;
      flex-shrink: 0; // 防止压缩
    }
  }

  .weekdays {
    position: absolute;
    left: -5px;
    top: 30px; // 调整顶部距离
    display: flex;
    flex-direction: column;
    gap: 18px; // 调整间距
    font-size: 11px;
    color: #666;
    width: 30px;

    span {
      text-align: center;
      line-height: 10px; // 与格子高度对齐
    }
  }

  .grid-container {
    display: flex;
    gap: 2px;
    padding-left: 30px;
    min-height: 100px;
    overflow-x: auto; // 添加横向滚动

    .week-column {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 10px; // 确保最小宽度
    }
  }

  .day-cell {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    background-color: #ebedf0;
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
      transform: scale(1.2);
    }
  }

  .activity-0 {
    background-color: #ebedf0;
  }
  .activity-1 {
    background-color: #9be9a8;
  }
  .activity-2 {
    background-color: #40c463;
  }
  .activity-3 {
    background-color: #30a14e;
  }
  .activity-4 {
    background-color: #216e39;
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 10px;
    font-size: 12px;
    color: #666;

    .legend-items {
      display: flex;
      gap: 2px;
    }

    .legend-text {
      font-size: 12px;
      color: #666;
    }
  }
}
</style>
