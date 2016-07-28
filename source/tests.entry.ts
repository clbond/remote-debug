import 'babel-polyfill';

import 'ts-helpers';

const context = (<{ context?(path: string, recurse: boolean, match: RegExp) }>require)
  .context('./', true, /^(.(?!tests\.entry))*\.ts$/);

context('./index.ts');

const tests = context.keys().filter(f => /\.test\.ts$/.test(f));

for (const test of tests) {
  context(test);
}
