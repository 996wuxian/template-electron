<template>
  <div class="p-10px flex flex-col gap-4 overflow-auto h-full">
    <!-- 热力图部分 -->
    <n-card title="活跃度统计" size="small">
      <div class="contribution-graph">
        <!-- 上半年热力图 -->
        <div class="half-year-section">
          <h4 class="section-title">上半年 (1-6月)</h4>

          <!-- 月份标题 -->
          <div class="months-header">
            <div v-for="month in firstHalfMonths" :key="month" class="month-label">
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
            <div v-for="(week, weekIndex) in firstHalfData" :key="weekIndex" class="week-column">
              <div
                v-for="(day, dayIndex) in week"
                :key="dayIndex"
                :class="[
                  'day-cell',
                  day
                    ? day.isFuture
                      ? 'future-day'
                      : getActivityClass(day.count) + (day.isToday ? ' today-day' : '')
                    : 'empty-day'
                ]"
                :title="day ? `${day.date}: ${day.count}次待办` : ''"
              ></div>
            </div>
          </div>
        </div>

        <!-- 下半年热力图 -->
        <div class="half-year-section">
          <h4 class="section-title">下半年 (7-12月)</h4>

          <!-- 月份标题 -->
          <div class="months-header">
            <div v-for="month in secondHalfMonths" :key="month" class="month-label">
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
            <div v-for="(week, weekIndex) in secondHalfData" :key="weekIndex" class="week-column">
              <div
                v-for="(day, dayIndex) in week"
                :key="dayIndex"
                :class="[
                  'day-cell',
                  day
                    ? day.isFuture
                      ? 'future-day'
                      : getActivityClass(day.count) + (day.isToday ? ' today-day' : '')
                    : 'empty-day'
                ]"
                :title="
                  day ? `${day.date}: ${day.isFuture ? '未来日期' : day.count + '次待办'}` : ''
                "
              ></div>
            </div>
          </div>
        </div>

        <!-- 图例 -->
        <div class="legend">
          <span class="legend-text">少</span>
          <div class="legend-items">
            <div class="day-cell activity-0"></div>
            <div class="day-cell activity-1"></div>
            <div class="day-cell activity-2"></div>
            <div class="day-cell activity-3"></div>
            <div class="day-cell activity-4"></div>
          </div>
          <span class="legend-text">多</span>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'

const todos = ref<any[]>([])

// 上半年月份
const firstHalfMonths = computed(() => {
  return ['1月', '2月', '3月', '4月', '5月', '6月']
})

// 下半年月份
const secondHalfMonths = computed(() => {
  return ['7月', '8月', '9月', '10月', '11月', '12月']
})

// 生成指定时间范围的贡献数据
const generateContributionData = (startMonth: number, endMonth: number) => {
  const weeks = []
  const currentYear = dayjs().year()
  const startDate = dayjs(`${currentYear}-${startMonth.toString().padStart(2, '0')}-01`)

  // 修改结束日期逻辑，显示到月份的最后一天
  const endDate =
    endMonth === 12
      ? dayjs(`${currentYear}-12-31`) // 下半年显示到12月31日
      : dayjs(`${currentYear}-${(endMonth + 1).toString().padStart(2, '0')}-01`).subtract(1, 'day') // 上半年显示到6月30日

  let currentDate = startDate

  // 生成每周的数据
  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
    const weekData = []
    const startDayOfWeek = currentDate.day() // 0=周日, 1=周一, ..., 6=周六

    // 第一周：可能不是从周一开始，前面用空白填充
    if (currentDate.isSame(startDate, 'day')) {
      const emptyDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1
      for (let i = 0; i < emptyDays; i++) {
        weekData.push(null)
      }
    }

    // 添加这一周的实际天数
    for (let day = weekData.length; day < 7; day++) {
      if (currentDate.isAfter(endDate)) {
        break
      }

      // 判断是否是未来日期
      const isToday = currentDate.isSame(dayjs(), 'day')
      const isFuture = currentDate.isAfter(dayjs(), 'day')

      weekData.push({
        date: currentDate.format('YYYY/MM/DD'),
        count: getTodoCountByDate(currentDate),
        dayOfWeek: day,
        isToday: isToday,
        isFuture: isFuture
      })
      currentDate = currentDate.add(1, 'day')
    }

    if (weekData.length > 0) {
      weeks.push(weekData)
    }
  }
  return weeks
}

// 上半年数据（1-6月）
const firstHalfData = computed(() => {
  return generateContributionData(1, 6)
})

// 下半年数据（7-12月）
const secondHalfData = computed(() => {
  return generateContributionData(7, 12)
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

onMounted(async () => {
  // 读取文件内容
  const data = await window.store.get('historyData')
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
  border-radius: 8px;
  padding: 15px;

  .half-year-section {
    margin-bottom: 30px;
    position: relative;

    &:last-of-type {
      margin-bottom: 15px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 10px;
      margin-left: 0;
    }
  }

  .months-header {
    display: flex;
    padding-left: 40px;
    margin-bottom: 8px;
    font-size: 10px;
    font-weight: 500;
    gap: 40px;

    .month-label {
      flex-shrink: 0;
      padding-left: 10px;
    }
  }

  .weekdays {
    position: absolute;
    left: 10px;
    top: 60px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    font-size: 10px;
    width: 30px;
    font-weight: 500;

    span {
      text-align: center;
      line-height: 11px;
      height: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .grid-container {
    display: flex;
    gap: 2px;
    padding-left: 40px;
    min-height: 100px;
    overflow-x: auto;
    padding-top: 2px;

    .week-column {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 11px;
    }
  }

  .day-cell {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    transition: all 0.2s ease;
    cursor: pointer;
    position: relative;
    background-color: #d1d5db;

    // 修复悬停效果
    &:hover {
      transform: scale(1.1);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
      z-index: 10;
    }
  }

  .empty-day {
    background: transparent !important;
    cursor: default;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  // 参考GitHub风格的颜色方案
  .activity-0 {
    background-color: #ebedf0;

    &:hover {
      background-color: #d1d5db;
    }
  }
  .activity-1 {
    background-color: #9be9a8;

    &:hover {
      background-color: #7dd3fc;
    }
  }
  .activity-2 {
    background-color: #40c463;

    &:hover {
      background-color: #22d3ee;
    }
  }
  .activity-3 {
    background-color: #30a14e;

    &:hover {
      background-color: #06b6d4;
    }
  }
  .activity-4 {
    background-color: #216e39;

    &:hover {
      background-color: #0891b2;
    }
  }

  .legend {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 15px;
    font-size: 10px;
    font-weight: 500;

    .legend-items {
      display: flex;
      gap: 2px;
      margin: 0 8px;
    }

    .legend-text {
      font-size: 10px;
    }
  }
}

.today-day {
  border: 1px solid #3984f3;
}

// 未来日期样式
.future-day {
  background-color: #f3f4f6;
  border: 1px dashed #d1d5db;

  &:hover {
    background-color: #e5e7eb;
  }
}
</style>
