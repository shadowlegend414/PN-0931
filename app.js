import {initializeApp} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,updateProfile,signOut} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import {initializeFirestore,persistentLocalCache,getFirestore,doc,getDoc,setDoc,updateDoc,deleteField} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const app=initializeApp({
  apiKey:"AIzaSyCe-gQ-mPH5Z_T_mWBv8AgaP2PgsKFHlcg",
  authDomain:"pn0931.firebaseapp.com",
  projectId:"pn0931",
  storageBucket:"pn0931.firebasestorage.app",
  messagingSenderId:"732936433481",
  appId:"1:732936433481:web:39ca9a8483805119b1b498"
});
const auth=getAuth(app);
let db;try{db=initializeFirestore(app,{localCache:persistentLocalCache()})}catch(e){db=getFirestore(app)}
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* Do not reorder chapters: progress is saved by position (P0, P1, C0...) */
const SUBJ=[
{k:"P",n:"Physics",c:"var(--ph)",ch:["Units & Measurements","Kinematics","Laws of Motion","Work, Energy & Power","Rotational Motion","Gravitation","Properties of Solids & Fluids","Thermodynamics & KTG","Oscillations & Waves","Electrostatics","Current Electricity","Magnetism & EMI","AC & EM Waves","Ray & Wave Optics","Modern Physics","Semiconductors"]},
{k:"C",n:"Chemistry",c:"var(--ch)",ch:["Some Basic Concepts","Atomic Structure","Periodic Table","Chemical Bonding","States of Matter & Solutions","Thermodynamics","Equilibrium","Redox & Electrochemistry","Chemical Kinetics","Coordination Compounds","d & f Block / Metallurgy","p-Block Elements","GOC & Isomerism","Hydrocarbons","Haloalkanes, Alcohols & Ethers","Carbonyls & Acids","Amines & Biomolecules"]},
{k:"M",n:"Maths",c:"var(--ma)",ch:["Sets, Relations & Functions","Complex Numbers","Quadratic Equations","Sequences & Series","Permutations & Combinations","Binomial Theorem","Matrices & Determinants","Limits & Continuity","Differentiation & Applications","Integration","Differential Equations","Straight Lines","Circles","Conic Sections","3D Geometry","Vectors","Probability","Statistics","Trigonometry"]}
];
const LAB=["Not started","Learning","Done","Revised"];
const ICON={
syl:'<path d="M5 4h13v16H7a2 2 0 0 1-2-2z"/><path d="M9 8h6"/>',
party:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c3 .2 5 2.3 5 5.8"/>',
tasks:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12 3 3 5-6"/>',
me:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'};
const NAV=[["home","Home"],["syl","Study"],["tests","Tests"],["doubts","Doubts"],["tasks","Tasks"],["party","Party"],["me","Profile"]];
ICON.home='<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>';
ICON.tests='<path d="M6 3h9l4 4v14H6z"/><path d="m9 13 2 2 4-4"/>';
ICON.doubts='<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>';
const TITLE={home:"Home",syl:"Study",tests:"Tests",doubts:"Doubts",tasks:"Daily Tasks",party:"Party",me:"Profile"};

let user=null,T={},tab="syl",sync="",pt=null,open={},TK=[],LOG={},PARTY="",PD=null,pmsg="",fresh=true,pk="",TS=[],DB=[],subj="P",X=newX(),lb="all",pm="";

/* ---------- saving ---------- */
const dkey=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const today=()=>dkey(new Date());
function streak(){const d=new Date();if(!LOG[dkey(d)])d.setDate(d.getDate()-1);let n=0;while(LOG[dkey(d)]>0){n++;d.setDate(d.getDate()-1)}return n}
function wkKey(){const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7));return dkey(d)}
function me(){
  let done=0,rev=0;const sp=[];SUBJ.forEach(s=>{const c=counts(s);done+=c[2]+c[3];rev+=c[3];sp.push(c[2]+c[3])});
  const tt=Object.values(LOG).reduce((a,b)=>a+b,0),st=streak(),t=today(),ws=wkKey(),mk=t.slice(0,7);
  let wc=0,mc=0,dc=0;Object.keys(X.at).forEach(k=>{if(T[k]>=2&&chName(k)){const a=X.at[k];if(a>=ws)wc++;if(a.slice(0,7)===mk)mc++;if(a===t)dc++}});
  let wt=0,mt=0;Object.keys(LOG).forEach(k=>{const v=LOG[k]||0;if(k>=ws&&k<=t)wt+=v;if(k.slice(0,7)===mk)mt+=v});
  return{name:user.displayName||"Student",done:done,streak:st,pts:done*10+rev*5+st*10+tt*2,sp:sp,tt:tt,wk:ws,wc:wc,wt:wt,mk:mk,mc:mc,mt:mt,dk:t,dc:dc,dt:LOG[t]||0,seen:Date.now()};
}
function roll(){const t=today();TK=TK.filter(x=>x.day===t||!x.done).map(x=>({...x,day:t}))}
function save(){
  try{localStorage.setItem("jee2-"+user.uid,JSON.stringify({T,TK,LOG,PARTY,TS,DB,X}))}catch(e){}
  setSync("Saving…");clearTimeout(pt);
  pt=setTimeout(async()=>{
    try{await setDoc(doc(db,"users",user.uid),{name:user.displayName||"",topics:T,tasks:TK,log:LOG,party:PARTY,tests:TS,doubts:DB,extra:X,updated:Date.now()},{merge:true});setSync("Saved")}
    catch(e){setSync("Not saved yet. Check your connection.");return}
    if(PARTY&&PD&&!(PD.kicked&&PD.kicked[user.uid])){const mm=me();PD.members=PD.members||{};PD.members[user.uid]=mm;try{await updateDoc(doc(db,"parties",PARTY),{["members."+user.uid]:mm})}catch(e){}}
  },600);
}
function setSync(t){sync=t;const s=$("sync");if(s)s.textContent=t}
async function load(u){
  T={};TK=[];LOG={};PARTY="";PD=null;TS=[];DB=[];X=newX();
  try{const l=JSON.parse(localStorage.getItem("jee2-"+u.uid)||"null");if(l){T=l.T||{};TK=l.TK||[];LOG=l.LOG||{};PARTY=l.PARTY||"";TS=l.TS||[];DB=l.DB||[];X={...newX(),...(l.X||{})}}else T=JSON.parse(localStorage.getItem("jee-"+u.uid)||"{}")}catch(e){}
  try{const s=await getDoc(doc(db,"users",u.uid));if(s.exists()){const d=s.data();T=d.topics||{};TK=d.tasks||[];LOG=d.log||{};PARTY=d.party||"";TS=d.tests||[];DB=d.doubts||[];X={...newX(),...(d.extra||{})};try{localStorage.setItem("jee2-"+u.uid,JSON.stringify({T,TK,LOG,PARTY,TS,DB,X}))}catch(e){}}}
  catch(e){sync="Offline. Showing saved progress."}
  roll();render();
  if(PARTY)loadParty(true);
}

/* ---------- views ---------- */
function counts(s){const c=[0,0,0,0];s.ch.forEach((_,i)=>c[T[s.k+i]||0]++);return c}
function donut(c,tot,col){
  const r=34,C=2*Math.PI*r;let off=0,seg="";
  [[3,1],[2,.6],[1,.3]].forEach(([s,o])=>{
    const l=c[s]/tot*C;
    if(l>0){seg+='<circle class="seg" cx="44" cy="44" r="34" fill="none" stroke="'+col+'" stroke-opacity="'+o+'" stroke-width="12" stroke-dasharray="'+l+" "+(C-l)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 44 44)"/>';off+=l}
  });
  const pct=Math.round((c[2]+c[3])/tot*100);
  return '<svg viewBox="0 0 88 88" width="88" height="88" role="img" aria-label="'+pct+' percent done"><circle cx="44" cy="44" r="34" fill="none" stroke="var(--grid)" stroke-width="12"/>'+seg+'<text x="44" y="50" text-anchor="middle" font-size="18" font-weight="800" fill="var(--ink)">'+pct+'%</text></svg>';
}
const LEVELS=[[0,"Rookie"],[100,"Grinder"],[300,"Strategist"],[600,"Ranker"],[1000,"Topper"]];
function stat(l,v,sub,d,n){return '<div class="card stat" style="--d:'+d+'"><small>'+l+'</small><b'+(n!=null?' data-n="'+n+'"':"")+'>'+v+"</b>"+sub+"</div>"}
function hero(){
  const m=me();let i=0;LEVELS.forEach((l,j)=>{if(m.pts>=l[0])i=j});
  const nx=LEVELS[i+1],pc=nx?(m.pts-LEVELS[i][0])/(nx[0]-LEVELS[i][0])*100:100;
  let tot=0;SUBJ.forEach(s=>tot+=s.ch.length);
  return '<div class="stats"><div class="card stat" style="--d:0"><small>Level '+(i+1)+'</small><b class="lvn">'+LEVELS[i][1]+'</b><div class="bar"><i style="width:'+pc+'%"></i></div><small>'+(nx?(nx[0]-m.pts)+" pts to "+nx[1]:"Top level reached")+"</small></div>"+
   stat("Points",m.pts,"",.08,m.pts)+stat("Streak 🔥",m.streak,"<small>days in a row</small>",.16,m.streak)+stat("Chapters",m.done,"<small>of "+tot+" done</small>",.24,m.done)+"</div>";
}
function boom(){
  if(matchMedia("(prefers-reduced-motion:reduce)").matches)return;
  const c=document.createElement("canvas");c.style.cssText="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99";
  c.width=innerWidth;c.height=innerHeight;document.body.appendChild(c);const x=c.getContext("2d");
  const cols=["#ffd43b","#2457f5","#139a52","#e8590c","#7048e8","#c2255c"];
  const ps=Array.from({length:90},()=>({x:c.width/2,y:c.height*.65,vx:(Math.random()-.5)*14,vy:-Math.random()*16-4,s:5+Math.random()*6,r:Math.random()*6,c:cols[Math.random()*6|0]}));
  let f=0;(function t(){x.clearRect(0,0,c.width,c.height);ps.forEach(q=>{q.vy+=.45;q.x+=q.vx;q.y+=q.vy;q.r+=.2;x.save();x.translate(q.x,q.y);x.rotate(q.r);x.fillStyle=q.c;x.fillRect(-q.s/2,-q.s/2,q.s,q.s*.6);x.restore()});if(++f<110)requestAnimationFrame(t);else c.remove()})();
}
function viewHome(){
  const nt=TK.length,nd=TK.filter(x=>x.done).length,pc=nt?Math.round(nd/nt*100):0,cont=[];
  SUBJ.forEach(s=>s.ch.forEach((n,i)=>{if((T[s.k+i]||0)===1)cont.push({s,n,k:s.k+i})}));
  const subs=SUBJ.map(s=>{const c=counts(s);return '<button class="chip" data-a="subj" data-k="'+s.k+'"><i style="background:'+s.c+'"></i>'+s.n+"<b>"+Math.round((c[2]+c[3])/s.ch.length*100)+"%</b></button>"}).join("");
  const tiles=[["tests","Tests"],["doubts","Doubts"],["tasks","Tasks"],["party","Party"]].map(([k,l])=>'<button class="tile" data-a="tab" data-k="'+k+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+ICON[k]+"</svg>"+l+"</button>").join("");
  const cl=cont.length?cont.slice(0,4).map(x=>'<div class="row"><span><i class="dot" style="background:'+x.s.c+'"></i>'+esc(x.n)+'</span><button class="st s1" data-a="cyc" data-k="'+x.k+'">Learning</button></div>').join(""):'<div class="empty"><b>Nothing in progress</b><span>Set a chapter to Learning in Study and it shows up here.</span></div>';
  return '<div class="card banner" style="--d:0"><div><small>Today\'s goal</small><h3>'+(nt?nd+" of "+nt+" tasks done":"Plan your day")+'</h3><button class="go sm" data-a="tab" data-k="tasks">'+(nt?"Open tasks":"Add tasks")+'</button></div><div class="ring" style="--p:'+pc+'"><b>'+pc+"%</b></div></div>"+hero()+'<h3 class="sec">Subjects</h3><div class="chips">'+subs+'</div><h3 class="sec">Quick access</h3><div class="tiles">'+tiles+'</div><h3 class="sec">Continue studying</h3><div class="card" style="--d:.3">'+cl+"</div>"+insights();
}
function viewSyl(){
  const s=SUBJ.find(x=>x.k===subj)||SUBJ[0],c=counts(s),n=s.ch.length;
  const tabs=SUBJ.map(x=>'<button class="chip'+(x.k===s.k?" on":"")+'" data-a="subj" data-k="'+x.k+'">'+x.n+"</button>").join("");
  let rows="";s.ch.forEach((name,i)=>{const v=T[s.k+i]||0;rows+='<div class="row"><span>'+esc(name)+'</span><span class="acts"><button class="fl'+(X.weak[s.k+i]?" on":"")+'" data-a="wk" data-k="'+s.k+i+'" aria-label="Flag as weak">⚑</button><button class="st s'+v+(pk===s.k+i?" pop":"")+'" data-a="cyc" data-k="'+s.k+i+'">'+LAB[v]+"</button></span></div>"});
  return '<div class="chips">'+tabs+'</div><div class="card" style="--d:0"><div class="sub">'+donut(c,n,s.c)+"<div><h3>"+s.n+"</h3><p>"+(c[2]+c[3])+" of "+n+" chapters done</p><p>"+c[3]+" revised, "+c[1]+' learning</p></div></div></div><div class="card" style="--d:.1">'+rows+'</div><p class="hint">Tap a status to move it forward: Not started, Learning, Done, Revised.</p>';
}
function viewTests(){
  const L=TS.slice(-8),pc=x=>Math.round(x.s/x.t*100),avg=TS.length?Math.round(TS.reduce((a,x)=>a+pc(x),0)/TS.length):0;
  const bars=L.length?'<div class="tbars">'+L.map(x=>'<div class="tb"><small>'+pc(x)+'%</small><i style="height:'+Math.max(4,Math.min(100,pc(x))*.8)+'%"></i></div>').join("")+"</div>":'<div class="empty"><b>No tests yet</b><span>Log a mock test to see your progress.</span></div>';
  const list=TS.slice().reverse().map(x=>'<div class="row"><div class="who"><b>'+esc(x.n)+"</b><small>"+x.d+"</small></div><b>"+x.s+"/"+x.t+" ("+pc(x)+'%)</b><button class="x" data-a="tdel" data-k="'+x.id+'" aria-label="Delete test">✕</button></div>').join("");
  return '<div class="card" style="--d:0"><small>Average score</small><div><span class="big" data-n="'+avg+'">'+avg+"</span></div><small>% across "+TS.length+" tests</small>"+bars+'</div><div class="card" style="--d:.1"><h3 class="h3">Log a test</h3><div class="form"><input id="tn" maxlength="30" placeholder="Test name" aria-label="Test name"><input id="ts" type="number" inputmode="decimal" placeholder="Score" aria-label="Score"><input id="tt" type="number" inputmode="decimal" value="300" aria-label="Total marks"><button class="go" data-a="tadd">Save</button></div><p class="msg err" role="alert">'+esc(pmsg)+"</p>"+list+"</div>";
}
function viewDoubts(){
  const nm={P:"Physics",C:"Chemistry",M:"Maths"},op=DB.filter(x=>!x.done).length;
  const list=DB.length?DB.map(x=>'<div class="row"><button class="chk'+(x.done?" on":"")+(pk===x.id?" pop":"")+'" data-a="dtog" data-k="'+x.id+'" aria-label="Mark doubt solved">'+(x.done?"✓":"")+'</button><span class="tt'+(x.done?" dn":"")+'">'+esc(x.t)+'</span><span class="tag">'+nm[x.b]+'</span><button class="x" data-a="ddel" data-k="'+x.id+'" aria-label="Delete doubt">✕</button></div>').join(""):'<div class="empty"><b>No doubts saved</b><span>Write down what you could not solve and tick it off once it is clear.</span></div>';
  return '<div class="card" style="--d:0"><small>Open doubts</small><div><span class="big" data-n="'+op+'">'+op+'</span></div><p class="mut">'+(DB.length-op)+' solved</p></div><div class="card" style="--d:.1"><div class="add"><input id="dtx" maxlength="120" placeholder="Type your doubt" aria-label="New doubt"><select id="dsb" aria-label="Subject"><option value="P">Physics</option><option value="C">Chemistry</option><option value="M">Maths</option></select><button class="go" data-a="dadd">Add</button></div>'+list+"</div>";
}
function viewTasks(){
  const n=TK.filter(x=>x.done).length,pc=TK.length?n/TK.length*100:0,st=streak();
  const list=TK.length?TK.map(x=>'<div class="row"><button class="chk'+(x.done?" on":"")+(pk===x.id?" pop":"")+'" data-a="tog" data-k="'+x.id+'" aria-label="Mark task done">'+(x.done?"✓":"")+'</button><span class="tt'+(x.done?" dn":"")+'">'+esc(x.t)+'</span><button class="x" data-a="del" data-k="'+x.id+'" aria-label="Delete task">✕</button></div>').join(""):'<div class="empty"><b>No tasks yet</b><span>Add what you will finish today.</span></div>';
  return '<div class="cols"><div class="card" style="--d:0"><small>Current streak</small><div><span class="big'+(st?" beat":"")+'" data-n="'+st+'">'+st+'</span></div><p class="mut">days in a row 🔥</p><div class="bar"><i style="width:'+pc+'%"></i></div><p class="mut">'+n+" of "+TK.length+' tasks done today</p></div><div class="card" style="--d:.1"><div class="add"><input id="tin" maxlength="80" placeholder="e.g. 30 questions of Kinematics" aria-label="New task"><button class="go" data-a="add">Add</button></div>'+list+"</div></div>";
}
const NUDGES=["🔥","👏","💪","⏰"];
const NTXT={"🔥":"Keep the streak alive","👏":"Great work","💪":"You've got this","⏰":"Time to study"};
const ago=ts=>{const m=Math.max(0,Math.round((Date.now()-(ts||0))/6e4));return m<1?"just now":m<60?m+"m ago":m<1440?Math.round(m/60)+"h ago":Math.round(m/1440)+"d ago"};
const isOwner=()=>!!(PD&&user&&PD.owner===user.uid);
const lvName=p=>{let i=0;LEVELS.forEach((l,j)=>{if(p>=l[0])i=j});return LEVELS[i][1]};
function ppts(v,m){
  if(m==="all")return v.pts||0;
  if(m==="week")return v.wk===wkKey()?(v.wc||0)*10+(v.wt||0)*2:0;
  return v.dk===today()?(v.dc||0)*10+(v.dt||0)*2:0;
}
function psub(v,m){
  if(m==="all")return (v.done||0)+" chapters, "+(v.streak||0)+" day streak";
  if(m==="week")return v.wk===wkKey()?(v.wc||0)+" chapters, "+(v.wt||0)+" tasks this week":"No activity this week";
  return v.dk===today()?(v.dc||0)+" chapters, "+(v.dt||0)+" tasks today":"No activity today";
}
function goalInfo(){
  const g=PD&&PD.goal;if(!g||!(g.n>0))return null;
  const key=g.p==="m"?today().slice(0,7):wkKey();let cur=0;
  Object.values(PD.members||{}).forEach(v=>{
    if(g.p==="m"){if(v.mk===key)cur+=g.k==="c"?(v.mc||0):(v.mt||0)}
    else if(v.wk===key)cur+=g.k==="c"?(v.wc||0):(v.wt||0);
  });
  return{g,cur,active:g.pk===key};
}
function profCard(){
  const v=PD.members&&PD.members[pm];if(!v)return"";
  const self=pm===user.uid,ow=isOwner();
  const sub=SUBJ.map((s,i)=>{const n=(v.sp&&v.sp[i])||0;return '<div class="kv2"><span><i class="dot" style="background:'+s.c+'"></i>'+s.n+"</span><b>"+n+"/"+s.ch.length+'</b></div><div class="bar sm"><i style="width:'+Math.round(n/s.ch.length*100)+"%;background:"+s.c+'"></i></div>'}).join("");
  const nudge=self?"":'<small style="display:block;margin-top:14px">Send a nudge</small><div class="nbs">'+NUDGES.map(e=>'<button class="nb" data-a="nudge" data-k="'+e+'" title="'+esc(NTXT[e])+'" aria-label="'+esc(NTXT[e])+'">'+e+"</button>").join("")+"</div>";
  const kick=ow&&!self?'<button class="go ghost" data-a="kick" style="margin-top:14px">Remove from party</button>':"";
  return '<div class="card" style="--d:.1"><div class="sub"><div class="av">'+esc((v.name||"S")[0].toUpperCase())+'</div><div><h3>'+esc(v.name)+(self?" (you)":"")+"</h3><p>"+lvName(v.pts||0)+" · last active "+(v.seen?ago(v.seen):"unknown")+'</p></div></div><div class="kv"><span>Points</span><b>'+(v.pts||0)+'</b></div><div class="kv"><span>Day streak</span><b>'+(v.streak||0)+'</b></div><div class="kv"><span>Chapters done</span><b>'+(v.done||0)+'</b></div><div class="kv"><span>Tasks completed</span><b>'+(v.tt||0)+"</b></div>"+sub+nudge+kick+"</div>";
}
function viewParty(){
  const m='<p class="msg '+(pmsg.startsWith("✓")?"ok":"err")+'" role="alert">'+esc(pmsg)+"</p>";
  if(!PARTY)return '<div class="cols2"><div class="card" style="--d:0"><h3 class="h3">Create a party</h3><label for="pname">Party name</label><input id="pname" maxlength="24"><button class="go" data-a="pcreate">Create party</button></div><div class="card" style="--d:.1"><h3 class="h3">Join with a code</h3><label for="pcode">Invite code</label><input id="pcode" maxlength="6" autocapitalize="characters" style="text-transform:uppercase"><button class="go" data-a="pjoin">Join party</button></div></div>'+m;
  if(!PD)return '<div class="card empty"><b>'+esc(pmsg||"Loading party…")+'</b><button class="link" data-a="prefresh">Try again</button></div>';
  const ow=isOwner();
  const ms=Object.entries(PD.members||{}).map(([id,v])=>({id,...v})).sort((a,b)=>ppts(b,lb)-ppts(a,lb)||(b.pts||0)-(a.pts||0));
  const top=Math.max(1,ms.length?ppts(ms[0],lb):1);
  /* announcement */
  const an=PD.ann&&PD.ann.t?'<div class="card ann" style="--d:0"><small>📢 '+esc(PD.ann.by||"Owner")+" · "+ago(PD.ann.ts)+"</small><p>"+esc(PD.ann.t)+"</p></div>":"";
  /* leaderboard */
  const tabsH='<div class="chips">'+[["day","Today"],["week","This week"],["all","All time"]].map(([k,l])=>'<button class="chip'+(lb===k?" on":"")+'" data-a="lb" data-k="'+k+'">'+l+"</button>").join("")+"</div>";
  const rows=ms.map((v,i)=>{const p=ppts(v,lb);return '<div class="row prow'+(pm===v.id?" sel":"")+'" data-a="pm" data-k="'+esc(v.id)+'" role="button" tabindex="0"><span class="rk r'+Math.min(i+1,4)+'">'+(i+1)+'</span><div class="who"><b>'+esc(v.name)+(v.id===user.uid?" (you)":"")+(v.id===PD.owner?' <span class="tag">owner</span>':"")+"</b><small>"+psub(v,lb)+'</small><div class="bar sm"><i style="width:'+Math.round(p/top*100)+'%"></i></div></div><b>'+p+" pts</b></div>"}).join("");
  const board='<div class="card" style="--d:.05"><h3 class="h3">Leaderboard</h3>'+tabsH+rows+'<p class="hint">Tap a member to see their profile. All time: 10 pts per chapter done, 5 more per revision, 10 per streak day, 2 per task. Today and week: 10 per chapter, 2 per task.</p></div>';
  /* goal */
  const gi=goalInfo();let gh;
  if(gi){
    const g=gi.g,pc=Math.min(100,Math.round(gi.cur/g.n*100)),unit=g.k==="c"?"chapters":"tasks",per=g.p==="m"?"this month":"this week";
    gh='<div class="card" style="--d:.05"><h3 class="h3">Party goal</h3>'+(gi.active?'<p class="mut">Together: '+g.n+" "+unit+" "+per+'</p><div class="bar"><i style="width:'+pc+'%"></i></div><p><b>'+gi.cur+" / "+g.n+"</b> "+(gi.cur>=g.n?"🎉 Goal reached!":"("+pc+"%)")+"</p>":'<p class="mut">The last goal ('+g.n+" "+unit+") has ended."+(ow?" Set a new one in Owner tools.":" Ask the owner for a new one.")+"</p>")+"</div>";
  }else gh='<div class="card" style="--d:.05"><h3 class="h3">Party goal</h3><p class="mut">'+(ow?"Set a goal for everyone in Owner tools.":"The owner has not set a goal yet.")+"</p></div>";
  /* nudges for me */
  const inb=Object.values((PD.nudges&&PD.nudges[user.uid])||{}).filter(x=>x&&Date.now()-x.ts<1728e5).sort((a,b)=>b.ts-a.ts);
  const nh=inb.length?'<div class="card" style="--d:.08"><h3 class="h3">For you</h3>'+inb.map(x=>'<div class="row"><span>'+esc(x.e)+" "+esc(x.n)+"</span><small>"+esc(NTXT[x.e]||"")+" · "+ago(x.ts)+"</small></div>").join("")+"</div>":"";
  /* chat */
  const cm=Object.values(PD.chat||{}).filter(x=>x&&x.t).sort((a,b)=>a.ts-b.ts).slice(-30);
  const chat='<div class="card" style="--d:.15"><h3 class="h3">Party chat</h3><div class="chat" id="chat">'+(cm.length?cm.map(x=>'<div class="cm'+(x.u===user.uid?" mine":"")+'"><small>'+esc(x.n)+" · "+ago(x.ts)+(x.u===user.uid||ow?' <button class="x" data-a="cdel" data-k="'+esc(x.id)+'" aria-label="Delete message">✕</button>':"")+"</small><p>"+esc(x.t)+"</p></div>").join(""):'<p class="mut">No messages yet. Say hi 👋</p>')+'</div><div class="add"><input id="pcm" maxlength="200" placeholder="Message your party" aria-label="Message"><button class="go" data-a="csend">Send</button></div></div>';
  /* owner tools */
  const own=ow?'<div class="card" style="--d:.2"><h3 class="h3">Owner tools</h3><label for="prn">Rename party</label><div class="add"><input id="prn" maxlength="24" value="'+esc(PD.name)+'"><button class="go" data-a="prn">Save</button></div><label for="pan">Announcement</label><div class="add"><input id="pan" maxlength="140" placeholder="Shown to everyone" aria-label="Announcement"><button class="go" data-a="pann">Post</button></div>'+(PD.ann&&PD.ann.t?'<button class="link" data-a="pannx">Clear announcement</button>':"")+'<label>Party goal</label><div class="form2"><select id="gk" aria-label="Goal type"><option value="c">Chapters</option><option value="t">Tasks</option></select><select id="gp" aria-label="Period"><option value="w">This week</option><option value="m">This month</option></select><input id="gn" type="number" inputmode="numeric" min="1" max="9999" value="50" aria-label="Target"><button class="go" data-a="pgoal">Set goal</button></div></div>':"";
  const info='<div class="card" style="--d:0"><h3 class="h3">'+esc(PD.name)+'</h3><small>'+ms.length+' member'+(ms.length===1?"":"s")+' · Invite code</small><p class="codew"><b class="code">'+esc(PARTY)+'</b></p><button class="go" data-a="pcopy">Copy invite code</button></div>';
  return '<div class="cols"><div class="stack">'+info+gh+nh+own+'<div class="btns"><button class="go ghost" data-a="prefresh">Refresh</button><button class="go ghost" data-a="pleave">Leave</button></div>'+m+'</div><div class="stack">'+an+board+profCard()+chat+"</div></div>";
}
async function loadParty(silent){
  const rr=()=>{if(!silent||tab==="party")render()};
  if(!PARTY){PD=null;rr();return}
  if(!silent){pmsg="";PD=null;render()}
  try{
    const s=await getDoc(doc(db,"parties",PARTY));
    if(!s.exists()){PARTY="";PD=null;pmsg="That party no longer exists.";save();rr();return}
    const d=s.data();
    if(d.kicked&&d.kicked[user.uid]){
      try{await updateDoc(doc(db,"parties",PARTY),{["members."+user.uid]:deleteField()})}catch(e){}
      PARTY="";PD=null;pmsg="You were removed from that party.";save();rr();return;
    }
    d.members=d.members||{};d.members[user.uid]=me();
    try{await updateDoc(doc(db,"parties",PARTY),{["members."+user.uid]:d.members[user.uid]})}catch(e){}
    PD=d;
  }catch(e){if(!silent)pmsg="Could not load the party. Check your connection."}
  if(!silent)fresh=true;
  rr();
}
async function pCreate(){
  const n=$("pname").value.trim().slice(0,24);
  if(!n){pmsg="Give your party a name.";render();return}
  const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let code="";for(let i=0;i<6;i++)code+=A[Math.floor(Math.random()*A.length)];
  try{await setDoc(doc(db,"parties",code),{name:n,owner:user.uid,members:{[user.uid]:me()}});PARTY=code;pm="";save();await loadParty()}
  catch(e){pmsg="Could not create the party. Check your connection and Firestore rules.";render()}
}
async function pJoin(){
  const code=$("pcode").value.trim().toUpperCase();
  if(!/^[A-Z0-9]{6}$/.test(code)){pmsg="Enter the 6-character code.";render();return}
  try{
    const s=await getDoc(doc(db,"parties",code));
    if(!s.exists()){pmsg="No party has that code.";render();return}
    const d0=s.data();
    if(d0.kicked&&d0.kicked[user.uid]){pmsg="You were removed from that party and cannot rejoin.";render();return}
    if(Object.keys(d0.members||{}).length>=20&&!(d0.members||{})[user.uid]){pmsg="That party is full (20 members).";render();return}
    await updateDoc(doc(db,"parties",code),{["members."+user.uid]:me()});PARTY=code;pm="";save();await loadParty();
  }catch(e){pmsg="Could not join. Check your connection and Firestore rules.";render()}
}
async function pLeave(){
  const upd={["members."+user.uid]:deleteField()};
  if(PD&&PD.owner===user.uid){const nx=Object.keys(PD.members||{}).find(id=>id!==user.uid);if(nx)upd.owner=nx}
  try{await updateDoc(doc(db,"parties",PARTY),upd)}catch(e){}
  PARTY="";PD=null;pmsg="";pm="";save();render();
}
/* write to the party doc, then update the local copy and redraw */
async function pUpd(data,local){
  if(!PARTY||!PD)return;
  try{await updateDoc(doc(db,"parties",PARTY),data);pmsg="";if(local)local(PD)}
  catch(e){pmsg="Could not save. Check your connection."}
  render();
}
const myName=()=>(user.displayName||"Student").slice(0,24);
function pNudge(e){
  if(!PD||!pm||pm===user.uid||!NUDGES.includes(e))return;
  const old=PD.nudges&&PD.nudges[pm]&&PD.nudges[pm][user.uid];
  if(old&&Date.now()-old.ts<36e5){pmsg="You already nudged them. Try again in an hour.";render();return}
  const n={n:myName(),e,ts:Date.now()},to=pm;
  pUpd({["nudges."+to+"."+user.uid]:n},p=>{p.nudges=p.nudges||{};p.nudges[to]=p.nudges[to]||{};p.nudges[to][user.uid]=n;pmsg="✓ Nudge "+e+" sent."});
}
function pKick(id){
  if(!isOwner()||!id||id===user.uid||!PD.members[id])return;
  const nm=PD.members[id].name||"this member";
  if(!confirm("Remove "+nm+" from the party? They will not be able to rejoin."))return;
  pUpd({["members."+id]:deleteField(),["kicked."+id]:true},p=>{delete p.members[id];p.kicked=p.kicked||{};p.kicked[id]=true;pm="";pmsg="✓ Removed "+nm+"."});
}
function pChat(){
  const i=$("pcm"),t=i?i.value.trim().slice(0,200):"";if(!t||!PD)return;
  const id=Date.now().toString(36)+Math.random().toString(36).slice(2,5),msg={id,u:user.uid,n:myName(),t,ts:Date.now()};
  const old=Object.values(PD.chat||{}).filter(x=>x&&x.id).sort((a,b)=>a.ts-b.ts),extra=old.slice(0,Math.max(0,old.length-49));
  const data={["chat."+id]:msg};extra.forEach(x=>{data["chat."+x.id]=deleteField()});
  pUpd(data,p=>{p.chat=p.chat||{};p.chat[id]=msg;extra.forEach(x=>delete p.chat[x.id])});
}
function pCdel(id){
  const x=PD&&PD.chat&&PD.chat[id];if(!x||!(x.u===user.uid||isOwner()))return;
  pUpd({["chat."+id]:deleteField()},p=>{delete p.chat[id]});
}
function pRename(){
  if(!isOwner())return;
  const n=$("prn").value.trim().slice(0,24);if(!n)return;
  pUpd({name:n},p=>{p.name=n;pmsg="✓ Party renamed."});
}
function pAnn(clear){
  if(!isOwner())return;
  if(clear){pUpd({ann:deleteField()},p=>{delete p.ann});return}
  const t=$("pan").value.trim().slice(0,140);if(!t)return;
  const a={t,by:myName(),ts:Date.now()};
  pUpd({ann:a},p=>{p.ann=a;pmsg="✓ Announcement posted."});
}
function pGoal(){
  if(!isOwner())return;
  const n=Math.round(+$("gn").value),k=$("gk").value,per=$("gp").value;
  if(!(n>=1&&n<=9999)||!["c","t"].includes(k)||!["w","m"].includes(per)){pmsg="Enter a goal between 1 and 9999.";render();return}
  const g={k,p:per,n,pk:per==="m"?today().slice(0,7):wkKey()};
  pUpd({goal:g},p=>{p.goal=g;pmsg="✓ Party goal set."});
}
function viewSoon(t,d){return '<div class="card empty"><b>'+t+"</b><span>"+d+"</span></div>"}
function viewMe(){
  const m=me();
  return '<div class="cols2"><div class="card prof" style="--d:0"><div class="av big2">'+esc((m.name[0]||"S").toUpperCase())+'</div><h3 class="h3">'+esc(m.name)+'</h3><p class="mut" style="word-break:break-all;margin-bottom:12px">'+esc(user.email||"")+'</p><div class="kv"><span>Chapters done</span><b>'+m.done+'</b></div><div class="kv"><span>Day streak</span><b>'+m.streak+'</b></div><div class="kv"><span>Points</span><b>'+m.pts+'</b></div><button class="go ghost" data-a="exp">Download backup</button><button class="go ghost" data-a="out" style="margin-top:10px">Log out</button></div><div class="card" style="--d:.1"><h3 class="h3">Achievements</h3><div class="bds">'+badges().map(([n,e])=>'<span class="bg'+(e?" on":"")+'">'+(e?"★ ":"🔒 ")+n+"</span>").join("")+"</div></div></div>";
}
function render(){
  $("authView").hidden=!!user;$("shell").hidden=!user;
  if(!user)return;
  const V={home:viewHome,syl:viewSyl,tests:viewTests,doubts:viewDoubts,tasks:viewTasks,party:viewParty,me:viewMe},body=(V[tab]||viewHome)();
  const nm=user.displayName||"there";
  $("app").innerHTML='<div class="top"><div><h2>'+TITLE[tab]+'</h2><p class="mut">Hi '+esc(nm)+', keep going.</p></div><span class="sync" id="sync">'+esc(sync)+"</span></div>"+body;
  $("nav").innerHTML=NAV.map(([k,l])=>'<button data-a="tab" data-k="'+k+'"'+(tab===k?' aria-current="page"':"")+'><svg viewBox="0 0 24 24" aria-hidden="true">'+ICON[k]+"</svg>"+l+"</button>").join("");
  $("av").textContent=(nm[0]||"S").toUpperCase();$("un").textContent=nm;
  const ch=$("chat");if(ch)ch.scrollTop=ch.scrollHeight;
  const fr=fresh;$("app").classList.toggle("in",fr);fresh=false;pk="";
  if(fr)document.querySelectorAll("[data-n]").forEach(el=>{const t=+el.dataset.n;let st=null;const f=ts=>{st=st||ts;const q=Math.min((ts-st)/900,1);el.textContent=Math.round(t*(1-Math.pow(1-q,3)));if(q<1)requestAnimationFrame(f)};requestAnimationFrame(f)});
}
function newX(){return{exam:"",goal:3,weak:{},at:{}}}
const QUOTES=["Small steps every day beat big plans someday.","One chapter today is one less worry in the exam hall.","Revision turns what you learned into what you know.","Don't count the days. Make the days count.","A weak chapter is a strong one waiting for practice.","Consistency beats intensity.","Solve one more question than yesterday."];
const dd=(a,b)=>Math.round((new Date(a+"T00:00")-new Date(b+"T00:00"))/864e5);
function chName(k){const q=SUBJ.find(x=>x.k===k[0]),n=q&&q.ch[+k.slice(1)];return n?{n,c:q.c}:null}
function ringSvg(p,col,txt){const C=213.6,l=Math.min(1,p)*C;return '<svg viewBox="0 0 88 88" width="96" height="96"><circle cx="44" cy="44" r="34" fill="none" stroke="var(--grid)" stroke-width="10"/><circle class="seg" cx="44" cy="44" r="34" fill="none" stroke="'+col+'" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+l+" "+(213.6-l)+'" transform="rotate(-90 44 44)"/><text x="44" y="50" text-anchor="middle" font-size="18" font-weight="800" fill="var(--ink)">'+txt+"</text></svg>"}
function insights(){
  const t=today(),n=TK.filter(x=>x.done).length,dl=X.exam?dd(X.exam,t):null;
  const cd='<div class="card" style="--d:.35"><small>Exam countdown</small>'+(dl!=null&&dl>=0?'<div><span class="big" data-n="'+dl+'">'+dl+'</span></div><p class="mut">days to go</p>':'<p class="h3" style="margin:8px 0">'+(dl==null?"Set your exam date":"Exam day has passed")+"</p>")+'<input id="exd" type="date" value="'+esc(X.exam)+'" aria-label="Exam date" style="margin-top:10px"></div>';
  const goal='<div class="card" style="--d:.4"><small>Daily goal</small><div class="sub" style="margin-top:8px">'+ringSvg(n/X.goal,"var(--ok)",n+"/"+X.goal)+'<div><p class="mut">'+(n>=X.goal?"Goal reached. Great work!":(X.goal-n)+" more tasks today")+'</p><div class="btns" style="margin-top:8px"><button class="go ghost" data-a="gl" data-k="-1" style="padding:6px 16px" aria-label="Lower goal">−</button><button class="go ghost" data-a="gl" data-k="1" style="padding:6px 16px" aria-label="Raise goal">+</button></div></div></div></div>';
  const quote='<div class="card" style="--d:.45"><small>Thought for today</small><p class="qt">'+QUOTES[new Date().getDate()%QUOTES.length]+"</p></div>";
  const d0=new Date();d0.setDate(d0.getDate()-d0.getDay()-77);let cells="";
  for(let i=0;i<84;i++){const k=dkey(d0),v=LOG[k]||0;cells+='<i class="'+(k>t?"f":"l"+Math.min(4,v))+'" title="'+k+": "+v+' tasks"></i>';d0.setDate(d0.getDate()+1)}
  const days=[],dn="SMTWTFS";for(let i=6;i>=0;i--){const q=new Date();q.setDate(q.getDate()-i);days.push([dn[q.getDay()],LOG[dkey(q)]||0])}
  const mx=Math.max(1,...days.map(x=>x[1]));
  const bars=days.map(([l,v])=>"<div><small>"+v+'</small><i style="height:'+Math.max(4,v/mx*70)+'px"></i><small>'+l+"</small></div>").join("");
  const due=Object.keys(X.at).filter(k=>T[k]>=2&&chName(k)).map(k=>({k,d:dd(t,X.at[k])})).filter(o=>o.d>=(T[o.k]===2?3:14)).sort((a,b)=>b.d-a.d).slice(0,5);
  const dueH=due.length?due.map(o=>{const c=chName(o.k);return '<div class="row"><span><i class="dot" style="background:'+c.c+'"></i>'+esc(c.n)+"</span><small>"+(T[o.k]===2?"Done ":"Revised ")+o.d+"d ago</small></div>"}).join(""):'<p class="mut" style="margin-top:8px">Nothing due. Mark chapters Done to get revision reminders.</p>';
  const wk=Object.keys(X.weak).filter(k=>X.weak[k]&&chName(k)).slice(0,6);
  const wkH=wk.length?wk.map(k=>{const c=chName(k);return '<div class="row"><span><i class="dot" style="background:'+c.c+'"></i>'+esc(c.n)+"</span></div>"}).join(""):'<p class="mut" style="margin-top:8px">Tap the flag next to a chapter in Study to mark it weak.</p>';
  return '<h3 class="sec">Insights</h3><div class="grid3">'+cd+goal+quote+'<div class="card" style="--d:.5"><h3 class="h3">Activity</h3><div class="ht">'+cells+'</div></div><div class="card" style="--d:.55"><h3 class="h3">This week</h3><div class="wkb">'+bars+'</div></div><div class="card" style="--d:.6"><h3 class="h3">Revise now</h3>'+dueH+'</div><div class="card" style="--d:.65"><h3 class="h3">Weak chapters</h3>'+wkH+"</div></div>";
}
function badges(){
  const m=me(),tt=Object.values(LOG).reduce((a,b)=>a+b,0),full=SUBJ.some(q=>q.ch.every((_,i)=>(T[q.k+i]||0)>=2));
  return [["First task",tt>=1],["3-day streak",m.streak>=3],["7-day streak",m.streak>=7],["30-day streak",m.streak>=30],["10 chapters",m.done>=10],["25 chapters",m.done>=25],["Subject complete",full],["5 mock tests",TS.length>=5],["Party member",!!PARTY],["100 points",m.pts>=100]];
}
function exportData(){
  const b=new Blob([JSON.stringify({name:user.displayName,email:user.email,exported:today(),topics:T,tasks:TK,log:LOG,tests:TS,doubts:DB,extra:X},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="jee-tracker-backup-"+today()+".json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
document.addEventListener("change",e=>{if(e.target.id==="exd"){X.exam=e.target.value;save();render()}});
function syncLog(){LOG[today()]=TK.filter(x=>x.done).length}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-a]");if(!b||!user)return;
  const a=b.dataset.a,k=b.dataset.k;
  if(a==="tab"){tab=k;fresh=true;pmsg="";window.scrollTo(0,0)}
  else if(a==="cyc"){T[k]=((T[k]||0)+1)%4;pk=k;if(T[k]>=2)X.at[k]=today();save();if(T[k]===3)boom()}
  else if(a==="add"){const v=$("tin").value.trim();if(v&&TK.length<50){TK.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),t:v.slice(0,80),done:false,day:today()});save()}}
  else if(a==="tog"){const x=TK.find(t=>t.id===k);if(x){x.done=!x.done;pk=k;syncLog();save();if(x.done&&TK.every(t=>t.done))boom()}}
  else if(a==="del"){TK=TK.filter(t=>t.id!==k);syncLog();save()}
  else if(a==="subj"){subj=k;tab="syl";fresh=true;window.scrollTo(0,0)}
  else if(a==="tadd"){const n=$("tn").value.trim().slice(0,30)||"Mock test",sc=parseFloat($("ts").value),tt=parseFloat($("tt").value);if(!isFinite(sc)||!(tt>0)||sc>tt){pmsg="Enter a score and total marks. The score cannot be more than the total.";render();return}pmsg="";TS.push({id:Date.now().toString(36),n:n,s:sc,t:tt,d:today()});TS=TS.slice(-100);save()}
  else if(a==="tdel"){TS=TS.filter(x=>x.id!==k);save()}
  else if(a==="dadd"){const v=$("dtx").value.trim();if(v&&DB.length<100){DB.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,4),t:v.slice(0,120),b:$("dsb").value,done:false});save()}}
  else if(a==="dtog"){const x=DB.find(q=>q.id===k);if(x){x.done=!x.done;pk=k;save();if(x.done)boom()}}
  else if(a==="ddel"){DB=DB.filter(q=>q.id!==k);save()}
  else if(a==="wk"){X.weak[k]=X.weak[k]?0:1;save()}
  else if(a==="gl"){X.goal=Math.max(1,Math.min(20,X.goal+(+k)));save()}
  else if(a==="exp"){exportData();return}
  else if(a==="out"){signOut(auth);return}
  else if(a==="pcreate"){pCreate();return}
  else if(a==="pjoin"){pJoin();return}
  else if(a==="pleave"){pLeave();return}
  else if(a==="prefresh"){loadParty();return}
  else if(a==="pcopy"){if(navigator.clipboard)navigator.clipboard.writeText(PARTY).then(()=>{pmsg="✓ Code copied.";render()},()=>{});return}
  else if(a==="lb"){lb=k;pm=""}
  else if(a==="pm"){pm=pm===k?"":k}
  else if(a==="nudge"){pNudge(k);return}
  else if(a==="kick"){pKick(pm);return}
  else if(a==="csend"){pChat();return}
  else if(a==="cdel"){pCdel(k);return}
  else if(a==="prn"){pRename();return}
  else if(a==="pann"){pAnn(false);return}
  else if(a==="pannx"){pAnn(true);return}
  else if(a==="pgoal"){pGoal();return}
  render();
  if(a==="tab"&&k==="party")loadParty();
  if(a==="add"){const i=$("tin");if(i)i.focus()}
});
document.addEventListener("keydown",e=>{const M={tin:"add",dtx:"dadd",tn:"tadd",ts:"tadd",tt:"tadd",pcm:"csend",prn:"prn",pan:"pann",gn:"pgoal"};if(e.key==="Enter"&&M[e.target.id]){const b=document.querySelector('[data-a="'+M[e.target.id]+'"]');if(b)b.click()}else if(e.key==="Enter"&&e.target.classList&&e.target.classList.contains("prow"))e.target.click()});
/* refresh the party every 30s while it is open (skipped while you are typing) */
setInterval(()=>{const t=document.activeElement&&document.activeElement.tagName;if(user&&PARTY&&tab==="party"&&!document.hidden&&!/INPUT|SELECT|TEXTAREA/.test(t||""))loadParty(true)},30000);
document.addEventListener("toggle",e=>{const d=e.target;if(d.dataset&&d.dataset.s)open[d.dataset.s]=d.open},true);

/* ---------- login ---------- */
let mode="login";
function setMsg(t,c){const m=$("msg");m.textContent=t||"";m.className="msg "+(c||"")}
function setMode(m){
  mode=m;setMsg("");
  $("tLogin").setAttribute("aria-selected",m==="login");
  $("tSignup").setAttribute("aria-selected",m==="signup");
  $("fName").hidden=m!=="signup";
  $("fPass").hidden=m==="reset";
  $("pass").autocomplete=m==="signup"?"new-password":"current-password";
  $("go").textContent=m==="login"?"Log in":m==="signup"?"Create account":"Send reset link";
  $("forgot").textContent=m==="reset"?"Back to log in":"Forgot password?";
}
function why(e){
  const c=(e&&e.code)||"";
  if(c==="auth/invalid-credential"||c==="auth/wrong-password"||c==="auth/user-not-found")return "Email or password is wrong. Check both and try again.";
  if(c==="auth/email-already-in-use")return "This email already has an account. Use Log in instead.";
  if(c==="auth/weak-password")return "Use a password with at least 6 characters.";
  if(c==="auth/invalid-email")return "Enter a valid email address, like name@gmail.com.";
  if(c==="auth/too-many-requests")return "Too many tries. Wait a few minutes, then try again.";
  if(c==="auth/network-request-failed")return "No internet connection. Check your network and try again.";
  return "Something went wrong ("+(c||"unknown")+"). Try again.";
}
$("tLogin").onclick=()=>setMode("login");
$("tSignup").onclick=()=>setMode("signup");
$("forgot").onclick=()=>setMode(mode==="reset"?"login":"reset");
$("eye").onclick=()=>{const p=$("pass"),s=p.type==="password";p.type=s?"text":"password";$("eye").textContent=s?"Hide":"Show"};
$("go").onclick=async()=>{
  const email=$("email").value.trim(),pass=$("pass").value,name=$("name").value.trim();
  if(!email){setMsg("Enter your email.","err");return}
  if(mode!=="reset"&&!pass){setMsg("Enter your password.","err");return}
  if(mode==="signup"&&!name){setMsg("Enter your name. Friends will see it.","err");return}
  $("go").disabled=true;setMsg("");
  try{
    if(mode==="login")await signInWithEmailAndPassword(auth,email,pass);
    else if(mode==="signup"){
      const c=await createUserWithEmailAndPassword(auth,email,pass);
      await updateProfile(c.user,{displayName:name.slice(0,24)});
      try{await setDoc(doc(db,"users",c.user.uid),{name:name.slice(0,24),updated:Date.now()},{merge:true})}catch(x){}
      render();
    }else{await sendPasswordResetEmail(auth,email);setMsg("Reset link sent. Check your inbox and spam folder.","ok")}
  }catch(e){setMsg(why(e),"err")}
  $("go").disabled=false;
};
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&!$("authView").hidden&&e.target.tagName==="INPUT")$("go").click()});

onAuthStateChanged(auth,u=>{
  user=u;sync="";
  if(u){tab="home";fresh=true;load(u)}else{T={};TK=[];LOG={};PARTY="";PD=null;TS=[];DB=[];X=newX();render()}
});
