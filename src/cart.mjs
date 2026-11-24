export function change(cart,id,storage,delta){const key=id+':'+storage;const existing=cart.find(x=>x.key===key);return existing?cart.map(x=>x.key===key?{...x,qty:x.qty+delta}:x).filter(x=>x.qty>0):delta>0?[...cart,{key,id,storage,qty:delta}]:cart}
export function unit(p,storage){return p.price+Math.max(0,p.storage.indexOf(storage))*150}
export function total(cart,products){return cart.reduce((n,x)=>{const p=products.find(p=>p.id===x.id);return n+(p?unit(p,x.storage)*x.qty:0)},0)}
export function money(n,c){return c==='BRL'?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n*5.4):'US$ '+n.toFixed(2)}
export function restore(raw,products){try{const a=JSON.parse(raw);return Array.isArray(a)?a.filter(x=>products.some(p=>p.id===x.id&&p.storage.includes(x.storage))&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<=99&&x.key===x.id+':'+x.storage):[]}catch{return []}}
