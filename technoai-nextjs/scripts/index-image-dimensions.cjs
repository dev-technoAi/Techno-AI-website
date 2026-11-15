const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
(async () => {
 const files = [];
 function walk(dir) { for (const e of fs.readdirSync(dir,{withFileTypes:true})) { const f=path.join(dir,e.name); if(e.isDirectory()) walk(f); else if(/\.(png|jpe?g|webp|avif)$/i.test(f)) files.push(f); } }
 walk('public');
 const out = {};
 for(let i=0;i<files.length;i+=16) await Promise.all(files.slice(i,i+16).map(async file=>{ try { const m=await sharp(file).metadata(); if(m.width&&m.height) out['/'+file.slice(7).replaceAll('\\','/')]={width:m.width,height:m.height}; } catch {} }));
 fs.writeFileSync('content/image-dimensions.json',JSON.stringify(out));
 console.log(Object.keys(out).length+' images indexed');
})();
