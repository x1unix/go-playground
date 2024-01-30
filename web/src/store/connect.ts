import { connect as reduxConnect } from 'react-redux'
import { type State } from './state'

/**
 * Type-safe wrapper around redux connect with prepared state types
 *
 * @param mapStateToProps
 */
export const connect =
  <StateProps, OwnProps>(mapStateToProps: (state: State) => StateProps) =>
  (jsxElem) =>
    reduxConnect<StateProps, any, OwnProps, State>(mapStateToProps)(jsxElem)
