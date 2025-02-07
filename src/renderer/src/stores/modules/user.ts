import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import piniaPersistConfig from '@renderer/utils/persist'
import { Session } from '@renderer/utils/storage'

interface User {
  id?: number
  userName?: string
  roleName?: string
  roleId?: number
}

interface State {
  userInfo: User
  isTop?: string
  winTop?: string
}

interface Action<T extends keyof State> {
  type: T
  value: State[T]
}

const useUserStore = defineStore(
  'user',
  () => {
    const state = reactive<State>({
      userInfo: {} as User,
      winTop: Session.get('winTop') || '0',
      isTop: Session.get('isTop') || '0'
    })

    const setUserInfo = async (action: any) => {
      state.userInfo = action.userInfo
    }

    const setTop = async <T extends keyof State>(action: Action<T>) => {
      state[action.type] = action.value
    }

    return {
      ...toRefs(state),
      setUserInfo,
      setTop
    }
  },
  {
    persist: piniaPersistConfig('userInfo', ['userInfo'])
  }
)

export default useUserStore
