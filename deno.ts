import * as run from './bundle.js';

let ytData: any;
Deno.readTextFile('./bundle.js').then((js) => {
  eval(js);

  console.log(run);
  let ar = [];
  for (var i = 0; i < Deno.args.length; i++) {
    if (i % 2 !== 0) {
      // index is even
      ar.push(Deno.args[i]);
    }
  }

  (window as any).connectElgatoStreamDeckSocket?.apply(window, ar);
  const write = Deno.writeTextFile('./hello.txt', ar.join());
});
