import { createBrowserHistory } from 'history'
import { applyMiddleware, compose, createStore, type Store } from 'redux'
import thunk from 'redux-thunk'
import { routerMiddleware } from 'connected-react-router'

import { createRootReducer, getInitialState } from './reducers'
import { type Action } from './actions'
import { type State } from './state'

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export const history = createBrowserHistory()

export function configureStore(): Store<State, Action> {
  const preloadedState = getInitialState()
  return createStore(
    createRootReducer(history),
    preloadedState as any,
    composeEnhancers(applyMiddleware(routerMiddleware(history), thunk)),
  )
}
