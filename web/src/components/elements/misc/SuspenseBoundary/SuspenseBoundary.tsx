import React, { type PropsWithChildren, Suspense } from 'react'
import { type IStackStyles, mergeStyleSets, Spinner, Stack, useTheme } from '@fluentui/react'
import { Poster } from '../Poster'

type ContainerProps = PropsWithChildren<{
  styles?: IStackStyles
}>

const SuspenseContainer: React.FC<ContainerProps> = ({ children, styles }) => {
  const theme = useTheme()
  const stackStyles: IStackStyles = mergeStyleSets(
    {
      root: {
        background: theme.semanticColors.bodyBackground,
      },
    },
    styles,
  )

  return (
    <Stack grow verticalFill horizontalAlign="center" verticalAlign="center" styles={stackStyles}>
      {children}
    </Stack>
  )
}

interface ErrorProps extends ContainerProps {
  errorLabel?: string
  error?: Error
}

const SuspenseErrorBoundary: React.FC<ErrorProps> = ({ styles, children, error, errorLabel }) => {
  return error ? (
    <SuspenseContainer styles={styles}>
      <Poster label={errorLabel ?? 'Error'} type="error" message={error.toString()} />
    </SuspenseContainer>
  ) : (
    <>{children}</>
  )
}

interface PreloaderProps {
  preloaderText?: string
  styles?: IStackStyles
}

const SuspensePreloader: React.FC<PreloaderProps> = ({ preloaderText }) => {
  return (
    <SuspenseContainer>
      <Spinner key="spinner" label={preloaderText ?? 'Loading...'} labelPosition="right" />
    </SuspenseContainer>
  )
}

export interface SuspenseProps extends PreloaderProps {
  errorLabel?: string
}

interface State {
  error?: Error
}

export class SuspenseBoundary extends React.Component<PropsWithChildren<SuspenseProps>, State> {
  state: State = {}

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('failed to render a component', error, errorInfo)
    this.setState({ error })
  }

  render() {
    return (
      <SuspenseErrorBoundary errorLabel={this.props.errorLabel} error={this.state.error}>
        <Suspense fallback={<SuspensePreloader preloaderText={this.props.preloaderText} />}>
          {this.props.children}
        </Suspense>
      </SuspenseErrorBoundary>
    )
  }

  static getDerivedStateFromError(err: Error) {
    return {
      error: err,
    }
  }
}
