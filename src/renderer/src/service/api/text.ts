import request from '../request'

const module = '/api/user/'

export function Login(data: any, showLoading: boolean = false, showMsg: boolean = false) {
  return request<any>({
    method: 'post',
    url: `${module}login`,
    data,
    showLoading,
    showMsg
  })
}

export function UserList(showLoading: boolean = false, showMsg: boolean = false) {
  return request<any>({
    method: 'get',
    url: `${module}userList`,
    showLoading,
    showMsg
  })
}
