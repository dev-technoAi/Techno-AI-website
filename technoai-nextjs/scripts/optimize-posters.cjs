const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
(async () => {
 const files = ['hero-film.jpg', ...['financial','robotics','satellite','industrial','security'].map(name=>`solutions/${name}.jpg`)];
 for (const file of files) {
   const output=path.join('public/redesign/optimized',file.replace(/\.jpg$/,'.webp'));
   await fs.mkdir(path.dirname(output),{recursive:true});
   await sharp(path.join('public/redesign',file)).resize({width:1600,withoutEnlargement:true}).webp({quality:80}).toFile(output);
 }
 console.log('Generated 6 static video posters');
})();
