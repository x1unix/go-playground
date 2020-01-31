importScripts('wasm_exec.js');

const FN_EXIT = 'exit';
const TYPE_ANALYZE = 'ANALYZE';
const TYPE_EXIT = 'EXIT';

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
    module = wrapModule(module);
    onmessage = (msg) => {
        const {id, type, data} = msg.data;
        switch (type) {
            case TYPE_ANALYZE:
                module.analyzeCode(data)
                    .then(result => postMessage({id, type, result}))
                    .catch(error => postMessage({id, type, error}));
                break;
            case TYPE_EXIT:
                module.exit();
                break;
            default:
                console.error('worker: unknown message type "%s"', type);
                return;
        }
    };
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
    go.argv = ['js', 'onModuleInit'];
    fetchAndInstantiate("worker.wasm", go.importObject)
        .then(instance => go.run(instance))
        .catch(err => console.error('worker: Go error ', err));

    onmessage = (data) => {
        console.log('worker: onmessage ', data);
    }
}

main();