// 指定秒數 → preview/qa/f_<秒>.png（供檢視；和正式渲染使用同一頁面與 renderFrame）
const fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve('.');const pw=require(process.env.PLAYWRIGHT_MODULE);
const secs=process.argv.slice(2).map(Number);
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.wav':'audio/wav','.jpg':'image/jpeg','.png':'image/png'};
(async()=>{
 const srv=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/^\/$/,'/index.html'));if(!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404).end();return;}r.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 const b=await pw.chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 const p=await b.newPage({viewport:{width:1920,height:1080}});const errs=[];
 p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto(`http://127.0.0.1:${srv.address().port}/?export=1`);await p.waitForFunction(()=>window.__ready===true,null,{timeout:30000});
 fs.mkdirSync('preview/qa',{recursive:true});
 for(const s of secs){const f=Math.round(s*30);await p.evaluate(async f=>{await window.renderFrame(f)},f);await p.locator('#stage').screenshot({path:`preview/qa/f_${s.toFixed(1)}.png`});}
 await b.close();srv.close();if(errs.length){console.error('ERRORS',errs);process.exit(2);}
})();
