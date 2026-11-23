// Zero-dependency static web server for Railway, Render, VPS, and local Node.js.
// In Railway select this directory as the service Root Directory.
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {extname,join,resolve,sep} from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL(".",import.meta.url));
const mimes={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml"};
const port=Number(process.env.PORT)||3000;
createServer(async(req,res)=>{
  if(req.method!=="GET"&&req.method!=="HEAD"){res.writeHead(405,{"Allow":"GET, HEAD"});res.end();return}
  let path;
  try{path=decodeURIComponent(new URL(req.url,"http://localhost").pathname)}catch{res.writeHead(400);res.end("Bad Request");return}
  if(path==="/health"){res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({ok:true}));return}
  const relative=path==="/"?"/index.html":path;
  const target=resolve(root,"."+relative);
  if(!target.startsWith(resolve(root)+sep)){res.writeHead(403);res.end("Forbidden");return}
  try{
    const meta=await stat(target);
    if(!meta.isFile())throw Error("Not a file");
    const data=await readFile(target);
    res.writeHead(200,{"Content-Type":mimes[extname(target)]||"application/octet-stream","Cache-Control":"public, max-age=300","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none';"});
    res.end(req.method==="HEAD"?undefined:data)
  }catch{res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});res.end("Not found")}
}).listen(port,"0.0.0.0",()=>console.log("MicroStudy listening on http://0.0.0.0:"+port));