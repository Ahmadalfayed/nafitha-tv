const CATS=[["all","الكل"],["fav","⭐ المفضلة"],["kuwait","🇰🇼 الكويت"],["news","أخبار"],["gulf","الخليج"],["sports","رياضة"],["kids","أطفال"],["religious","قرآن ودين"],["docs","وثائقي"],["mine","قوائمي"]];
const $=s=>document.querySelector(s);let all=[],cat="all",hls=null,cur=null,retries=0;
const ls=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};const ss=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let favs=ls("favs",[]),recent=ls("recent",[]),mine=ls("mine",[]);
function parseM3U(t){const out=[];let m=null;for(const l of t.split(/\r?\n/)){const s=l.trim();if(s.startsWith("#EXTINF")){m={name:s.split(",").slice(1).join(",").trim()||"قناة",logo:(s.match(/tvg-logo="([^"]*)"/)||[])[1]||""}}else if(s&&!s.startsWith("#")&&m){out.push({id:"u"+btoa(unescape(encodeURIComponent(s))).slice(-16),name:m.name,logo:m.logo,url:s,cats:["mine"]});m=null}}return out}
function card(c){const d=document.createElement("div");d.className="ch";d.tabIndex=0;const f=favs.includes(c.id);
d.innerHTML=`<button class="fav" aria-label="مفضلة">${f?"★":"☆"}</button><div class="lg">${c.logo?`<img loading="lazy" src="${c.logo}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`:""}<span class="ph" style="display:${c.logo?"none":"block"}">${c.name[0]}</span></div><b>${c.name}</b><small>${c.q?c.q+"p":""}</small>`;
d.onclick=e=>{if(e.target.classList.contains("fav")){toggleFav(c.id);e.stopPropagation();return}play(c)};d.onkeydown=e=>{if(e.key==="Enter")play(c)};return d}
function toggleFav(id){favs=favs.includes(id)?favs.filter(x=>x!==id):[...favs,id];ss("favs",favs);render()}
function render(){const q=$("#q").value.trim().toLowerCase();const g=$("#grid");g.innerHTML="";
let list=all.filter(c=>cat==="all"||(cat==="fav"?favs.includes(c.id):c.cats.includes(cat))).filter(c=>!q||c.name.toLowerCase().includes(q)||c.id.toLowerCase().includes(q));
list.forEach(c=>g.appendChild(card(c)));if(!list.length)g.innerHTML=`<div class="empty">${cat==="mine"?"ما أضفت قوائم للحين. اضغط «＋ قائمتي».":cat==="fav"?"اضغط ☆ على أي قناة عشان تنضاف هني.":"ما فيه نتائج"}</div>`;
const r=$("#recent");r.innerHTML="";const rc=recent.map(id=>all.find(c=>c.id===id)).filter(Boolean);rc.forEach(c=>r.appendChild(card(c)));$("#recentWrap").hidden=!rc.length||!!q||cat!=="all";
document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.c===cat))}
function err(msg){const e=$("#perr");e.hidden=false;e.innerHTML=`${msg}<br><button onclick="play(cur)">إعادة المحاولة</button>`}
function play(c){cur=c;$("#perr").hidden=true;$("#player").hidden=false;$("#pname").textContent=c.name;$("#plogo").src=c.logo||"icon.svg";$("#fav2").textContent=favs.includes(c.id)?"★":"☆";
recent=[c.id,...recent.filter(x=>x!==c.id)].slice(0,12);ss("recent",recent);const v=$("#v");if(hls){hls.destroy();hls=null}
if(window.Hls&&Hls.isSupported()){hls=new Hls({lowLatencyMode:false,capLevelToPlayerSize:true});hls.loadSource(c.url);hls.attachMedia(v);
hls.on(Hls.Events.MANIFEST_PARSED,()=>{retries=0;v.play().catch(()=>{})});
hls.on(Hls.Events.ERROR,(e,d)=>{if(!d.fatal)return;if(d.type===Hls.ErrorTypes.MEDIA_ERROR){hls.recoverMediaError();return}
if(retries++<3){setTimeout(()=>hls&&hls.loadSource(c.url),1500*retries)}else err("القناة ما تشتغل الحين. ممكن البث متوقف مؤقتاً أو محجوب في منطقتك.")})}
else{v.src=c.url;v.play().catch(()=>{});v.onerror=()=>err("تعذّر تشغيل القناة.")}}
function closeP(){$("#player").hidden=true;if(hls){hls.destroy();hls=null}const v=$("#v");v.pause();v.removeAttribute("src");v.load();if(document.fullscreenElement)document.exitFullscreen();render()}
$("#close").onclick=closeP;document.addEventListener("keydown",e=>{if((e.key==="Escape"||e.key==="Backspace"||e.key==="GoBack")&&!$("#player").hidden&&e.target.tagName!=="INPUT"){e.preventDefault();closeP()}});
$("#fs").onclick=()=>{const p=$("#player");document.fullscreenElement?document.exitFullscreen():(p.requestFullscreen?.()||$("#v").webkitEnterFullscreen?.());try{screen.orientation.lock("landscape")}catch{}};
$("#fav2").onclick=()=>{toggleFav(cur.id);$("#fav2").textContent=favs.includes(cur.id)?"★":"☆"};
$("#q").oninput=render;$("#addBtn").onclick=()=>{$("#m3uMsg").textContent="";$("#dlg").showModal()};
async function addList(text){const l=parseM3U(text);if(!l.length){$("#m3uMsg").textContent="ما لقيت قنوات في هالقائمة.";return}mine=[...mine,...l].slice(0,2000);ss("mine",mine);load();cat="mine";render();$("#m3uMsg").textContent=`تمت إضافة ${l.length} قناة ✅`}
$("#m3uAdd").onclick=async e=>{e.preventDefault();const u=$("#m3uUrl").value.trim();if(!u)return;try{const r=await fetch(u);await addList(await r.text())}catch{$("#m3uMsg").textContent="ما قدرت أفتح الرابط. جرّب تنزّل الملف وتختاره."}};
$("#m3uFile").onchange=async e=>{const f=e.target.files[0];if(f)await addList(await f.text())};
$("#m3uClear").onclick=e=>{e.preventDefault();mine=[];ss("mine",mine);load();render();$("#m3uMsg").textContent="انحذفت قوائمك."};
let base=[];function load(){all=[...base,...mine]}
$("#cats").innerHTML=CATS.map(([k,n])=>`<button data-c="${k}">${n}</button>`).join("");$("#cats").onclick=e=>{if(e.target.dataset.c){cat=e.target.dataset.c;render()}};
fetch("channels.json").then(r=>r.json()).then(j=>{base=j;load();render();const p=new URLSearchParams(location.search).get("c");if(p){const c=all.find(x=>x.id===p);c&&play(c)}});
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
