import {EvalEventKind, instantiateStreaming} from "@services/api";
import {bootstrapGoWithInstance} from "@services/go/index";

const logger = {
  log: (eventType: EvalEventKind, message: string) => {
    if (eventType === EvalEventKind.Stdout) {
      console.log(message);
      return;
    }
    console.error(message);
  }
}

const go = bootstrapGoWithInstance(logger);
go['argv'] = ['js', 'onFooInit'];

window['onFooInit'] = obj => {
  console.log(obj);
  obj.exit();
}


export async function foo() {
  const {instance, module} = await instantiateStreaming(fetch('/go.wasm'), go.importObject);
  console.log('Got instance', instance);
  go.run(instance).catch(console.error);
}
