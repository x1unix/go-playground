import {saveAs} from 'file-saver';
import {push} from 'connected-react-router';
import {
  Action,
  ActionType,
  MonacoParamsChanges,
  newBuildParamsChangeAction,
  newBuildResultAction,
  newErrorAction,
  newImportFileAction,
  newLoadingAction,
  newMonacoParamsChangeAction,
  newPanelStateChangeAction,
  newSettingsChangeAction,
  newProgramWriteAction,
  newToggleThemeAction,
  newUIStateChangeAction
} from './actions';
import client, {
  EvalEventKind,
  instantiateStreaming,
  PlaygroundBackend
} from '~/services/api';
import config, {RuntimeType} from '~/services/config';
import {DEMO_CODE} from '~/components/editor/props';
import {getImportObject, goRun} from '~/services/go';
import {PanelState, SettingsState, State} from './state';
import {isDarkModeEnabled} from "~/utils/theme";

export type StateProvider = () => State
export type DispatchFn = (a: Action | any) => any
export type Dispatcher = (dispatch: DispatchFn, getState: StateProvider) => void

/////////////////////////////
//      Dispatchers        //
/////////////////////////////

export function newImportFileDispatcher(f: File): Dispatcher {
  return (dispatch: DispatchFn, _: StateProvider) => {
    const reader = new FileReader();
    reader.onload = e => {
      const data = e.target?.result as string;
      dispatch(newImportFileAction(f.name, data));
    };

    reader.onerror = e => {
      // TODO: replace with a nice modal
      alert(`Failed to import a file: ${e}`)
    };

    reader.readAsText(f, 'UTF-8');
  };
}

export function newCodeImportDispatcher(name: string, contents: string): Dispatcher {
  return (dispatch: DispatchFn, _: StateProvider) => {
    dispatch(newImportFileAction(`${encodeURIComponent(name)}.go`, contents));
  };
}

export function newMonacoParamsChangeDispatcher(changes: MonacoParamsChanges): Dispatcher {
  return (dispatch: DispatchFn, _: StateProvider) => {
    const current = config.monacoSettings;
    config.monacoSettings = Object.assign(current, changes);
    dispatch(newMonacoParamsChangeAction(changes));
  };
}

export const newSettingsChangeDispatcher = (changes: Partial<SettingsState>): Dispatcher => (
  (dispatch: DispatchFn, _: StateProvider) => {
    if ('useSystemTheme' in changes) {
      config.useSystemTheme = !!changes.useSystemTheme;
      changes.darkMode = isDarkModeEnabled();
    }

    if ('darkMode' in changes) {
      config.darkThemeEnabled = !!changes.darkMode;
    }

    dispatch(newSettingsChangeAction(changes));
  }
);

export function newBuildParamsChangeDispatcher(runtime: RuntimeType, autoFormat: boolean): Dispatcher {
  return (dispatch: DispatchFn, _: StateProvider) => {
    config.runtimeType = runtime;
    config.autoFormat = autoFormat;
    dispatch(newBuildParamsChangeAction(runtime, autoFormat));
  };
}


export function newSnippetLoadDispatcher(snippetID?: string): Dispatcher {
  return async (dispatch: DispatchFn, _: StateProvider) => {
    if (!snippetID) {
      dispatch(newImportFileAction('prog.go', DEMO_CODE));
      return;
    }

    dispatch(newLoadingAction());
    try {
      console.log('loading snippet %s', snippetID);
      const resp = await client.getSnippet(snippetID);
      const { fileName, code } = resp;
      dispatch(newImportFileAction(fileName, code));
    } catch (err: any) {
      dispatch(newErrorAction(err.message));
    }
  }
}

export const shareSnippetDispatcher: Dispatcher =
  async (dispatch: DispatchFn, getState: StateProvider) => {
    dispatch(newLoadingAction());
    try {
      const { code } = getState().editor;
      const { snippetID } = await client.shareSnippet(code);
      dispatch(push(`/snippet/${snippetID}`));
      dispatch(newUIStateChangeAction({ shareCreated: true, snippetId: snippetID }));
    } catch (err: any) {
      dispatch(newErrorAction(err.message));
    }
  };

export const saveFileDispatcher: Dispatcher =
  (_: DispatchFn, getState: StateProvider) => {
    try {
      const { fileName, code } = getState().editor;
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, fileName);
    } catch (err) {
      // TODO: replace with a nice modal
      alert(`Failed to save a file: ${err}`)
    }
  };

export const runFileDispatcher: Dispatcher =
  async (dispatch: DispatchFn, getState: StateProvider) => {
    dispatch(newLoadingAction());
    try {
      const { settings, editor } = getState();
      switch (settings.runtime) {
        case RuntimeType.GoPlayground:
          const res = await client.evaluateCode(editor.code, settings.autoFormat);
          dispatch(newBuildResultAction(res));
          break;
        case RuntimeType.GoTipPlayground:
          const rsp = await client.evaluateCode(editor.code, settings.autoFormat, PlaygroundBackend.GoTip);
          dispatch(newBuildResultAction(rsp));
          break;
        case RuntimeType.WebAssembly:
          let resp = await client.build(editor.code, settings.autoFormat);
          let wasmFile = await client.getArtifact(resp.fileName);
          let instance = await instantiateStreaming(wasmFile, getImportObject());
          dispatch({ type: ActionType.EVAL_START });
          dispatch(newBuildResultAction({ formatted: resp.formatted, events: [] }));
          goRun(instance)
            .then(result => console.log('exit code: %d', result))
            .catch(err => console.log('err', err))
            .finally(() => dispatch({ type: ActionType.EVAL_FINISH }));
          break;
        default:
          dispatch(newErrorAction(`AppError: Unknown Go runtime type "${settings.runtime}"`));
      }
    } catch (err: any) {
      dispatch(newErrorAction(err.message));
    }
  };

export const formatFileDispatcher: Dispatcher =
  async (dispatch: DispatchFn, getState: StateProvider) => {
    dispatch(newLoadingAction());
    try {
      // Format code using GoTip is enabled to support
      // any syntax changes from unstable Go specs.
      const { editor: {code}, settings: { runtime } } = getState();
      const backend = runtime === RuntimeType.GoTipPlayground ? PlaygroundBackend.GoTip : PlaygroundBackend.Default;
      const res = await client.formatCode(code, backend);

      if (res.formatted) {
        dispatch(newBuildResultAction(res));
      }
    } catch (err: any) {
      dispatch(newErrorAction(err.message));
    }
  };

export const dispatchToggleTheme: Dispatcher =
  (dispatch: DispatchFn, getState: StateProvider) => {
    const { darkMode } = getState().settings;
    config.darkThemeEnabled = !darkMode;
    dispatch(newToggleThemeAction())
  };

export const dispatchPanelLayoutChange = (changes: Partial<PanelState>): Dispatcher => (
  (dispatch: DispatchFn, _: StateProvider) => {
    config.panelLayout = changes;
    dispatch(newPanelStateChangeAction(changes));
  }
);

//////////////////////////////////
//          Adapters            //
//////////////////////////////////

export const createGoConsoleAdapter = (dispatch: DispatchFn) =>
({
  log: (eventType: EvalEventKind, message: string) => {
    console.log('%s:\t%s', eventType, message);
    dispatch(newProgramWriteAction({
      Kind: eventType,
      Message: message,
      Delay: 0,
    }));
  }
});
