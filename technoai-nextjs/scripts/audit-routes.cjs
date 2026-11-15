const fs = require('node:fs');
const { JSDOM } = require('../.theme-ui-tests/node_modules/jsdom');
const base = process.env.AUDIT_URL || 'http://localhost:3100';
(async () => {
 const routes = [...new Set(['/', ...Object.keys(require('../content/routes.json')), '/old-home/', '/redesign-v1/'])];
 const results = [];
 for (let i = 0; i < routes.length; i += 6) await Promise.all(routes.slice(i, i + 6).map(async route => {
   const response = await fetch(base + route);
   const html = await response.text();
   const document = new JSDOM(html).window.document;
   results.push({route, status: response.status, title: document.title, h1: document.querySelectorAll('h1').length, images: document.images.length, unsizedImages: [...document.images].filter(img => !img.width || !img.height).length, bytes: Buffer.byteLength(html)});
 }));
 const missing = await fetch(base + '/performance-audit-missing-route/');
 const invalidForm = await fetch(base + '/wp-admin/admin-ajax.php', {method:'POST',body:new URLSearchParams({action:'elementor_pro_forms_send_form',post_id:'88',form_id:'invalid'})});
 const report = {routes:results.sort((a,b)=>a.route.localeCompare(b.route)), notFound:missing.status, invalidForm: {status:invalidForm.status, body:await invalidForm.json()}};
 fs.mkdirSync('audit',{recursive:true});
 fs.writeFileSync('audit/routes.json',JSON.stringify(report,null,2));
 console.log(`${results.length} routes checked; ${results.filter(r=>r.status!==200).length} failures; missing route: ${missing.status}; invalid form: ${invalidForm.status}`);
 if(results.some(r=>r.status!==200)||missing.status!==404||report.invalidForm.body.success!==false) process.exitCode=1;
})();
