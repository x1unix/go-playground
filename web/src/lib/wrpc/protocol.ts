export enum MessageType {
  None = 0,
  Event = 1,
  Request = 2,
  Response = 3,
}

export interface Message<T = any> {
  type: MessageType
  payload: T
}

export interface Request<T = any> {
  id: number
  method: string
  params: T
}

export interface Response<T = any> {
  id: number
  method: string
  err: any
  result: T
}

export interface Event<T = any> {
  name: string
  payload: T
}
