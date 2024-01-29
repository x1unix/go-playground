import config from '~/services/config';
import type { WorkspaceState } from './types';

const CONFIG_KEY = 'workspace.state';

const defaultFile = `
package main

import (
\t"fmt"
)

func main() {
\tfmt.Println("Hello, World!")
}
`.trimStart()

const defaultWorkspace: WorkspaceState = {
  selectedFile: 'main.go',
  files: {
    'main.go': defaultFile,
  }
}

export const saveWorkspaceState = (state: WorkspaceState) => {
  config.setObject(CONFIG_KEY, state);
};

export const loadWorkspaceState = (): WorkspaceState => (
  config.getObject(CONFIG_KEY, defaultWorkspace)
);
