import { instantiateStreaming } from "@services/api";
// import { createGoGlobals } from "@services/go/index";
import {GoWebAssemblyInstance, GoWrapper} from '~/lib/go';

export async function foo() {
  const go = new GoWrapper(new window.Go(),{debug: true});
  const {instance} = await instantiateStreaming(fetch('/go.wasm'), go.importObject);
  go.run(instance as GoWebAssemblyInstance)
    .then(() => console.log('execution finished'))
    .catch(console.error);
}
