import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import piniaPersistConfig from '@renderer/utils/persist'
import { Local } from '@renderer/utils/storage'

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
  isRightTop?: boolean
  fileType?: string
  filePath?: string
  historyPath?: string
  fileFullPath?: string
  historyFullPath?: string
  isHideMenu?: boolean
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
      winTop: Local.get('winTop') || '0',
      isTop: Local.get('isTop') || '0',
      isRightTop: false,
      fileType: Local.get('fileType') || 'txt',
      filePath: Local.get('filePath') || '',
      historyPath: Local.get('historyPath') || '',
      fileFullPath: Local.get('fileFullPath') || '',
      historyFullPath: Local.get('historyFullPath') || '',
      isHideMenu: Local.get('isHideMenu') || false
    })

    const setUserInfo = async (action: any) => {
      state.userInfo = action.userInfo
    }

    const setTop = async <T extends keyof State>(action: Action<T>) => {
      state[action.type] = action.value
    }

    const setStatus = async <T extends keyof State>(action: Action<T>) => {
      state[action.type] = action.value
    }

    const setValue = async <T extends keyof State>(action: Action<T>) => {
      state[action.type] = action.value
    }

    return {
      ...toRefs(state),
      setUserInfo,
      setTop,
      setStatus,
      setValue
    }
  },
  {
    persist: piniaPersistConfig('userInfo', ['userInfo'])
  }
)

export default useUserStore
