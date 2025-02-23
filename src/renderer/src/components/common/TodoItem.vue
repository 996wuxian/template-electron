<template>
  <div
    class="todo-item flex py-10px flex-col cursor-pointer animate__animated"
    :class="todo?.isRemove ? 'animate__fadeOutUp' : 'animate__fadeInDown'"
  >
    <div class="flex items-center w-100%">
      <n-checkbox
        v-show="checkBox"
        v-model:checked="todo!.completed"
        class="mr-2"
        @click.stop="toggleSubItemsSelection(todo)"
      />
      <div
        :class="{ 'line-through': todo.completed, 'max-w-110px': collapsed }"
        class="flex-1 max-length flex flex-col"
        @click="toggleDetails(todo, index)"
      >
        {{ todo.text }}
        <span class="text-12px text-gray">{{ todo.description }}</span>
      </div>
      <i
        i-solar-trash-bin-minimalistic-2-linear
        class="w-20px h-20px hover:text-red-500 ml-auto"
        @click.stop="deleteTodo(todos, index)"
      ></i>
    </div>

    <div v-if="todo.subTodos.length > 0" class="todo-subitems pl-6 mt-2 w-100%">
      <TodoItem
        v-for="(subTodo, i) in todo.subTodos"
        :key="subTodo.id"
        :todo="subTodo"
        :index="i"
        :todos="todo.subTodos"
        :collapsed="collapsed"
        :check-box="checkBox"
        @delete-todo="deleteTodo"
        @toggle-details="toggleDetails"
        @toggle-sub-items-selection="toggleSubItemsSelection"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Todo {
  id: number
  text: string
  completed: boolean
  isRemove: boolean
  createdAt: string
  subTodos: Todo[]
  level: number
  description: string
}

interface Props {
  todo: Todo
  index: number
  todos: Todo[]
  collapsed: boolean
  checkBox: boolean
}

defineProps<Props>()

const emit = defineEmits(['delete-todo', 'toggle-details', 'toggle-sub-items-selection'])

const toggleSubItemsSelection = (todo: Todo) => {
  emit('toggle-sub-items-selection', todo)
}

const toggleDetails = (todo: Todo, index: number) => {
  emit('toggle-details', todo, index)
}

const deleteTodo = (todos: Todo[], index: number) => {
  emit('delete-todo', todos, index)
}
</script>
