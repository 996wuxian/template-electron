<template>
  <div
    class="todo-item flex py-10px flex-col cursor-pointer animate__animated w-100%"
    :class="todo?.isRemove ? 'animate__fadeOutUp' : 'animate__fadeInDown'"
  >
    <div class="flex items-center w-100%" @click="toggleDetails(todo, index)">
      <!-- 添加完成并删除图标 -->
      <div
        v-show="checkBox"
        title="完成并删除"
        class="mr-2 cursor-pointer hover:scale-110 transition-transform"
        @click.stop="completeAndDelete(todo)"
      >
        <svg-icon
          name="finished"
          width="16"
          height="16"
          :fill="theme.themeType === 'dark' ? '#fff' : '#333'"
        />
      </div>

      <n-checkbox
        v-show="checkBox"
        v-model:checked="todo!.completed"
        class="mr-2"
        @click.stop="toggleSubItemsSelection(todo)"
      />
      <div
        :class="{
          'line-through': todo.completed,
          'truncate max-w-100px': collapsed,
          'max-w-200px': isHideMenu
        }"
      >
        <div class="truncate max-w-600px">{{ todo.text }}</div>
        <div class="text-12px text-gray truncate">{{ todo.description }}</div>
      </div>

      <div v-if="statusShow" class="ml-auto flex items-center">
        <i v-if="todo.reminderEnabled" i-solar-bell-broken class="w-20px h-20px mr-10px"></i>
        <div v-if="todo.status === 1" class="w-15px h-15px rounded-50% bg-red mr-10px"></div>
        <div v-if="todo.status === 2" class="w-15px h-15px rounded-50% bg-orange mr-10px"></div>
        <div v-if="todo.status === 3" class="w-15px h-15px rounded-50% bg-gray mr-10px"></div>
        <div v-if="todo.status === 4" class="w-15px h-15px rounded-50% bg-green-500 mr-10px"></div>
      </div>

      <i
        v-if="deleteShow"
        i-solar-trash-bin-minimalistic-2-linear
        class="w-20px h-20px hover:text-red-500"
        @click.stop="deleteTodo(todos, index)"
      ></i>
    </div>
    <div v-if="todo.subTodos && todo.subTodos.length > 0" class="todo-subitems pl-6 mt-2 w-100%">
      <TodoItem
        v-for="(subTodo, i) in todo.subTodos"
        :key="subTodo.id"
        :todo="subTodo"
        :index="i"
        :todos="todo.subTodos"
        :collapsed="collapsed"
        :check-box="checkBox"
        :delete-show="deleteShow"
        :status-show="statusShow"
        @delete-todo="deleteTodo"
        @toggle-details="toggleDetails"
        @toggle-sub-items-selection="toggleSubItemsSelection"
        @complete-and-delete="completeAndDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import useUserStore from '@renderer/stores/modules/user'
const useUser = useUserStore()
import useTheme from '@renderer/stores/modules/theme'
const theme = useTheme()

const isHideMenu = computed(() => useUser.$state.isHideMenu)

interface Todo {
  id: number
  text: string
  completed: boolean
  isRemove: boolean
  createdAt: string
  subTodos: Todo[]
  level: number
  description: string
  status: number
  reminderTime?: string
  reminderEnabled?: boolean
}

interface Props {
  todo: Todo
  index: number
  todos: Todo[]
  collapsed: boolean
  checkBox: boolean
  deleteShow?: boolean
  statusShow?: boolean
}

defineProps<Props>()

const emit = defineEmits([
  'delete-todo',
  'toggle-details',
  'toggle-sub-items-selection',
  'complete-and-delete'
])

const toggleSubItemsSelection = (todo: Todo) => {
  emit('toggle-sub-items-selection', todo)
}

const toggleDetails = (todo: Todo, index: number) => {
  emit('toggle-details', todo, index)
}

const deleteTodo = (todos: Todo[], index: number) => {
  emit('delete-todo', todos, index)
}

// 新增：完成并删除功能
const completeAndDelete = (todo: Todo) => {
  emit('complete-and-delete', todo)
}
</script>
