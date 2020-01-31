importScripts('wasm_exec.js');

const FN_EXIT = 'exit';

function wrapModule(module) {
    const wrapped = {
        exit: () => module.exit.call(module),
    };
    Object.keys(module).filter(k => k !== FN_EXIT).forEach(fnName => {
        wrapped[fnName] = (...args) => (new Promise((res, rej) => {
            const cb = (rawResp) => {
              try {
                  const resp = JSON.parse(rawResp);
                  if (resp.error) {
                      rej(new Error(`${fnName}: ${resp.error}`));
                      return;
                  }

                  res(resp.result);
              } catch (ex) {
                  rej(new Error(`${fnName}: ${ex}`));
              }
            };

            const newArgs = args.concat(cb);
            module[fnName].apply(self, newArgs);
        }))
    });
    return wrapped;
}

/**
 * WASM module load handler
 * @param module {Object}
 */
function onModuleInit(module) {
    console.log('module loaded!', module);
    module = wrapModule(module);

    module.handleMessage('foo')
        .then(result => console.log(result))
        .catch(err => console.error(err));
    //module.exit();
}

function fetchAndInstantiate(url, importObject) {
    return fetch(url).then(response =>
        response.arrayBuffer()
    ).then(bytes =>
        WebAssembly.instantiate(bytes, importObject)
    ).then(results =>
        results.instance
    );
}

function main() {
    const go = new Go();
    fetchAndInstantiate("worker.wasm", go.importObject)
        .then(instance => go.run(instance))
        .catch(err => console.error('worker: Go error ', err));

    onmessage = (data) => {
        console.log('worker: onmessage ', data);
    }
}

main();