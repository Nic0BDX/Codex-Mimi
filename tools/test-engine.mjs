import fs from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve("vite/package.json"))(
  "esbuild",
);
await fs.mkdir(".local", { recursive: true });
await build({
  stdin: {
    contents: `
import assert from 'node:assert/strict';
import {meganopoly,estateStateSchema} from './app/game/meganopoly/engine.ts';
let finished=0;
for(const count of [2,3,6]) for(let seed=1;seed<=30;seed++) {
 let value=seed;const rng={int(max){value=(Math.imul(value,1664525)+1013904223)>>>0;return Math.floor(value/4294967296*max);}};
 let s=meganopoly.createInitialState(Array.from({length:count},(_,i)=>'player-'+i),{roundLimit:10},rng),steps=0;
 while(!s.finished){assert(steps++<20000);const id=s.players[s.turn],action=meganopoly.bot(s,id,rng);assert(action);const result=meganopoly.applyAction(s,id,action,rng);assert(result.ok);s=result.state;const parsed=estateStateSchema.parse(s);assert(parsed.money.every(v=>v>=0));}
 assert.equal(new Set(s.ranking).size,s.ranking.length);assert.equal(s.ranking.length,count);finished++;
}
const initial=meganopoly.createInitialState(['nini','cherie'],{}, {int:()=>0});
assert.equal(initial.money[0],1500);assert.equal(meganopoly.applyAction(initial,'cherie',{type:'roll'},{int:()=>0}).ok,false);
assert(!JSON.stringify(meganopoly.getPlayerView(initial,'nini')).includes('decks'));
console.log(finished+' parties simulées, finances, tours et classement valides.');
`,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: ".local/engine-test.mjs",
});
await import(new URL("../.local/engine-test.mjs", import.meta.url));
