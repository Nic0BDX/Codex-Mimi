import fs from 'node:fs/promises';
const pending=[];
for(const [slug,expressions] of Object.entries({nini:['joie','colere','pleurs','boude','reflexion','dodo','bisou','clin_oeil','surprise','pouces','timide','gamer'],cycy:['joie','colere','pleurs','boude','reflexion','dodo','bisou','clin_oeil','surprise','amoureux','cool','gamer']})) {
 await fs.mkdir(`public/chibis/${slug}/default`,{recursive:true});
 for(const expression of expressions) pending.push(`/chibis/${slug}/default/${expression}.webp`);
}
let downloaded=0;
while(pending.length) await Promise.all(pending.splice(0,6).map(async asset=>{
 const response=await fetch('https://soiree-dede.vercel.app'+asset);
 if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw Error('Avatar absent: '+asset);
 await fs.writeFile('public'+asset,Buffer.from(await response.arrayBuffer()));downloaded++;
}));
console.log(`${downloaded} expressions originales téléchargées.`);
