import type { EditorRemote, DocumentState, InputMode, Position } from './common'

export type CommandHandler = (cmd: EditorCommand, rem: EditorRemote) => void

export enum CommandType {
  Empty,
  Run,
  Format,
  Share,
  EditorZoom,
}

type CommandPayloads = {
  [CommandType.Empty]: {}
  [CommandType.Run]: { doc: DocumentState }
  [CommandType.Format]: { doc: DocumentState }
  [CommandType.Share]: { doc: DocumentState }
  [CommandType.EditorZoom]: { newSize: number }
}

export type EditorCommand = {
  [K in keyof CommandPayloads]: { type: K } & CommandPayloads[K]
}[keyof CommandPayloads]

export type CommandOf<T extends CommandType> = Extract<EditorCommand, { type: T }>

export enum EventType {
  CursorPositionChanged,
  GutterClick,
  LoadingStateChange,
  InputModeChanged,
  VimModeChanged,
  VimInputCommandPress,
  VimInputCommandDone,
  EmacsMarkChanged,
  EmacsKeyChanged,
  CompletionSourceStatus,
}

export enum LoadState {
  Loading,
  Loaded,
  Error,
}

type LoadProgress = { status: LoadState.Loaded | LoadState.Loading } | { status: LoadState.Error; error: string }

type EventPayloads = {
  [EventType.CursorPositionChanged]: { position: Position }
  [EventType.GutterClick]: { position: Position }
  [EventType.LoadingStateChange]: { isLoading: boolean }
  [EventType.InputModeChanged]: { mode: InputMode; prevMode?: InputMode }
  [EventType.VimModeChanged]: { mode: string; subMode?: string }
  [EventType.VimInputCommandPress]: { key: string }
  [EventType.VimInputCommandDone]: {}
  [EventType.EmacsMarkChanged]: { isMarkSet: boolean }
  [EventType.EmacsKeyChanged]: { value: string }
  [EventType.CompletionSourceStatus]: LoadProgress
}

export type EditorEvent = {
  [K in keyof EventPayloads]: { type: K } & EventPayloads[K]
}[keyof EventPayloads]

export type EventOf<T extends EventType> = Extract<EditorEvent, { type: T }>
