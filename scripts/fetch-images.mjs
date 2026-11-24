import fs from 'node:fs/promises';
import path from 'node:path';
const products=JSON.parse(await fs.readFile('src/products.json','utf8'));
const slugs={'17pm':'iphone-17-pro-max-256gb-esim','17p':'iphone-17-pro-256gb-esim','17':'iphone-17-256gb','16':'iphone-16-128gb','15':'iphone-15-128gb','air':'iphone-air-256gb-esim','14':'iphone-14-128gb'};
const dir='public/images/products';await fs.mkdir(dir,{recursive:true});
const headers={'User-Agent':'Mozilla/5.0 (compatible; CatalogPreview/1.0)','Accept':'*/*'};
async function request(url){const r=await fetch(url,{headers,signal:AbortSignal.timeout(18000)});if(!r.ok)throw Error('HTTP '+r.status+' '+url);return r}
function decode(s){return s.replaceAll('&amp;','&').replaceAll('&#038;','&')}
async function candidates(p){const slug=slugs[p.id],base='https://siimportados.com';let urls=[];try{const r=await request(base+'/wp-json/wc/store/v1/products?slug='+slug);const data=await r.json();urls.push(...(data.find(x=>x.slug===slug)?.images||[]).map(x=>x.src));}catch(e){console.warn(p.id,'API:',e.message)}
if(!urls.length)try{const html=await(await request(base+'/produto/'+slug+'/')).text();for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){if(/(?:property|name)=["']og:image["']/i.test(tag)){const match=tag.match(/content=["']([^"']+)["']/i);if(match)urls.push(decode(match[1]))}}for(const match of html.matchAll(/data-large_image=["']([^"']+)["']/gi))urls.push(decode(match[1]));}catch(e){console.warn(p.id,'page:',e.message)}
if(p.image)urls.push(p.image);return [...new Set(urls.filter(u=>typeof u==='string'&&u.startsWith('https://')))];}
async function download(url,id,index){const res=await request(url);const bytes=Buffer.from(await res.arrayBuffer());let ext;if(bytes[0]===255&&bytes[1]===216)ext='jpg';else if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))ext='png';else if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')ext='webp';else if(bytes.toString('ascii',0,3)==='GIF')ext='gif';else throw Error('Not a supported image');if(bytes.length<2000||bytes.length>15000000)throw Error('Unexpected size');const file=id+'-'+index+'.'+ext;await fs.writeFile(path.join(dir,file),bytes);return '/images/products/'+file}
await Promise.all(products.map(async p=>{let images=[];for(const url of await candidates(p)){if(images.length>=2)break;try{const local=await download(url,p.id,images.length+1);images.push(local);console.log(p.name,local);}catch(e){console.warn(p.id,e.message)}}p.images=images;if(images.length)p.image=images[0];else console.error('NO LOCAL IMAGE:',p.name);}));
await fs.writeFile('src/products.json',JSON.stringify(products,null,2));console.log('Local image coverage:',products.filter(p=>p.images.length).length+'/'+products.length);
