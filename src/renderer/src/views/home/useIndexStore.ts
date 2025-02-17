import { ref } from 'vue'
import type { Todo } from './types'

export function useTodoManager(initialTodos: Todo[] = []) {
  const todos = ref<Todo[]>(initialTodos)
  const selectedTodo = ref<Todo | null>(null)

  const addTodo = (text: string, parent?: Todo) => {
    const newTodo: Todo = {
      id: Date.now(),
      text,
      completed: false,
      isRemove: false,
      createdAt: new Date().toISOString(),
      subTodos: []
    }

    parent ? parent.subTodos.push(newTodo) : todos.value.push(newTodo)
  }

  const deleteTodo = (target: Todo[], index: number) => {
    target[index].isRemove = true
    setTimeout(() => target.splice(index, 1), 500)
  }

  const toggleSelection = (todo: Todo, checked: boolean) => {
    todo.completed = checked
    todo.subTodos.forEach((sub) => toggleSelection(sub, checked))
  }

  return { todos, selectedTodo, addTodo, deleteTodo, toggleSelection }
}
