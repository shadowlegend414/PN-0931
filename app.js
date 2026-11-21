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
const NAV=[["syl","Syllabus"],["party","Party"],["tasks","Tasks"],["me","Profile"]];
const TITLE={syl:"Syllabus",party:"Party",tasks:"Daily Tasks",me:"Profile"};

let user=null,T={},tab="syl",sync="",pt=null,open={},TK=[],LOG={},PARTY="",PD=null,pmsg="",fresh=true,pk="";

/* ---------- saving ---------- */
const dkey=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const today=()=>dkey(new Date());
function streak(){const d=new Date();if(!LOG[dkey(d)])d.setDate(d.getDate()-1);let n=0;while(LOG[dkey(d)]>0){n++;d.setDate(d.getDate()-1)}return n}
function me(){
  let done=0,rev=0;SUBJ.forEach(s=>{const c=counts(s);done+=c[2]+c[3];rev+=c[3]});
  const tt=Object.values(LOG).reduce((a,b)=>a+b,0),st=streak();
  return{name:user.displayName||"Student",done:done,streak:st,pts:done*10+rev*5+st*10+tt*2};
}
function roll(){const t=today();TK=TK.filter(x=>x.day===t||!x.done).map(x=>({...x,day:t}))}
function save(){
  try{localStorage.setItem("jee2-"+user.uid,JSON.stringify({T,TK,LOG,PARTY}))}catch(e){}
  setSync("Saving…");clearTimeout(pt);
  pt=setTimeout(async()=>{
    try{await setDoc(doc(db,"users",user.uid),{name:user.displayName||"",topics:T,tasks:TK,log:LOG,party:PARTY,updated:Date.now()},{merge:true});setSync("Saved")}
    catch(e){setSync("Not saved yet. Check your connection.");return}
    if(PARTY){try{await updateDoc(doc(db,"parties",PARTY),{["members."+user.uid]:me()})}catch(e){}}
  },600);
}
function setSync(t){sync=t;const s=$("sync");if(s)s.textContent=t}
async function load(u){
  T={};TK=[];LOG={};PARTY="";PD=null;
  try{const l=JSON.parse(localStorage.getItem("jee2-"+u.uid)||"null");if(l){T=l.T||{};TK=l.TK||[];LOG=l.LOG||{};PARTY=l.PARTY||""}else T=JSON.parse(localStorage.getItem("jee-"+u.uid)||"{}")}catch(e){}
  try{const s=await getDoc(doc(db,"users",u.uid));if(s.exists()){const d=s.data();T=d.topics||{};TK=d.tasks||[];LOG=d.log||{};PARTY=d.party||"";try{localStorage.setItem("jee2-"+u.uid,JSON.stringify({T,TK,LOG,PARTY}))}catch(e){}}}
  catch(e){sync="Offline. Showing saved progress."}
  roll();render();
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
function viewSyl(){
  return hero()+'<div class="grid3">'+SUBJ.map((s,si)=>{
    const c=counts(s),n=s.ch.length;let rows="";
    s.ch.forEach((name,i)=>{const v=T[s.k+i]||0;rows+='<div class="row"><span>'+esc(name)+'</span><button class="st s'+v+(pk===s.k+i?" pop":"")+'" data-a="cyc" data-k="'+s.k+i+'">'+LAB[v]+"</button></div>"});
    return '<div class="card" style="--d:'+(.3+si*.08)+'"><div class="sub">'+donut(c,n,s.c)+"<div><h3>"+s.n+"</h3><p>"+(c[2]+c[3])+" of "+n+" done</p><p>"+c[3]+" revised, "+c[1]+' learning</p></div></div><details data-s="'+s.k+'"'+(open[s.k]?" open":"")+"><summary>Chapters</summary>"+rows+"</details></div>";
  }).join("")+'</div><p class="hint">Tap a status to move it forward: Not started, Learning, Done, Revised.</p>';
}
function viewTasks(){
  const n=TK.filter(x=>x.done).length,pc=TK.length?n/TK.length*100:0,st=streak();
  const list=TK.length?TK.map(x=>'<div class="row"><button class="chk'+(x.done?" on":"")+(pk===x.id?" pop":"")+'" data-a="tog" data-k="'+x.id+'" aria-label="Mark task done">'+(x.done?"✓":"")+'</button><span class="tt'+(x.done?" dn":"")+'">'+esc(x.t)+'</span><button class="x" data-a="del" data-k="'+x.id+'" aria-label="Delete task">✕</button></div>').join(""):'<div class="empty"><b>No tasks yet</b><span>Add what you will finish today.</span></div>';
  return '<div class="cols"><div class="card" style="--d:0"><small>Current streak</small><div><span class="big'+(st?" beat":"")+'" data-n="'+st+'">'+st+'</span></div><p class="mut">days in a row 🔥</p><div class="bar"><i style="width:'+pc+'%"></i></div><p class="mut">'+n+" of "+TK.length+' tasks done today</p></div><div class="card" style="--d:.1"><div class="add"><input id="tin" maxlength="80" placeholder="e.g. 30 questions of Kinematics" aria-label="New task"><button class="go" data-a="add">Add</button></div>'+list+"</div></div>";
}
function viewParty(){
  const m='<p class="msg err" role="alert">'+esc(pmsg)+"</p>";
  if(!PARTY)return '<div class="cols2"><div class="card" style="--d:0"><h3 class="h3">Create a party</h3><label for="pname">Party name</label><input id="pname" maxlength="24"><button class="go" data-a="pcreate">Create party</button></div><div class="card" style="--d:.1"><h3 class="h3">Join with a code</h3><label for="pcode">Invite code</label><input id="pcode" maxlength="6" autocapitalize="characters" style="text-transform:uppercase"><button class="go" data-a="pjoin">Join party</button></div></div>'+m;
  if(!PD)return '<div class="card empty"><b>'+esc(pmsg||"Loading party…")+'</b><button class="link" data-a="prefresh">Try again</button></div>';
  const ms=Object.entries(PD.members||{}).map(([id,v])=>({id,...v})).sort((a,b)=>b.pts-a.pts);
  const top=Math.max(1,ms[0].pts),rows=ms.map((v,i)=>'<div class="row"><span class="rk r'+Math.min(i+1,4)+'">'+(i+1)+'</span><div class="who"><b>'+esc(v.name)+(v.id===user.uid?" (you)":"")+"</b><small>"+v.done+" chapters, "+v.streak+' day streak</small><div class="bar sm"><i style="width:'+Math.round(v.pts/top*100)+'%"></i></div></div><b>'+v.pts+" pts</b></div>").join("");
  return '<div class="cols"><div class="stack"><div class="card" style="--d:0"><h3 class="h3">'+esc(PD.name)+'</h3><small>Invite code</small><p class="codew"><b class="code">'+esc(PARTY)+'</b></p><button class="go" data-a="pcopy">Copy invite code</button></div><div class="btns"><button class="go ghost" data-a="prefresh">Refresh</button><button class="go ghost" data-a="pleave">Leave</button></div>'+m+'</div><div class="card" style="--d:.1"><h3 class="h3">Leaderboard</h3>'+rows+'<p class="hint">10 pts per chapter done, 5 more per revision, 10 per streak day, 2 per task.</p></div></div>';
}
async function loadParty(){
  if(!PARTY){PD=null;render();return}
  pmsg="";PD=null;render();
  try{await updateDoc(doc(db,"parties",PARTY),{["members."+user.uid]:me()})}catch(e){}
  try{const s=await getDoc(doc(db,"parties",PARTY));if(s.exists())PD=s.data();else{PARTY="";pmsg="That party no longer exists.";save()}}
  catch(e){pmsg="Could not load the party. Check your connection."}
  fresh=true;render();
}
async function pCreate(){
  const n=$("pname").value.trim().slice(0,24);
  if(!n){pmsg="Give your party a name.";render();return}
  const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let code="";for(let i=0;i<6;i++)code+=A[Math.floor(Math.random()*A.length)];
  try{await setDoc(doc(db,"parties",code),{name:n,owner:user.uid,members:{[user.uid]:me()}});PARTY=code;save();await loadParty()}
  catch(e){pmsg="Could not create the party. Check your connection and Firestore rules.";render()}
}
async function pJoin(){
  const code=$("pcode").value.trim().toUpperCase();
  if(!/^[A-Z0-9]{6}$/.test(code)){pmsg="Enter the 6-character code.";render();return}
  try{
    const s=await getDoc(doc(db,"parties",code));
    if(!s.exists()){pmsg="No party has that code.";render();return}
    if(Object.keys(s.data().members||{}).length>=20&&!(s.data().members||{})[user.uid]){pmsg="That party is full (20 members).";render();return}
    await updateDoc(doc(db,"parties",code),{["members."+user.uid]:me()});PARTY=code;save();await loadParty();
  }catch(e){pmsg="Could not join. Check your connection and Firestore rules.";render()}
}
async function pLeave(){
  try{await updateDoc(doc(db,"parties",PARTY),{["members."+user.uid]:deleteField()})}catch(e){}
  PARTY="";PD=null;pmsg="";save();render();
}
function viewSoon(t,d){return '<div class="card empty"><b>'+t+"</b><span>"+d+"</span></div>"}
function viewMe(){
  const m=me();
  return '<div class="card prof" style="--d:0"><div class="av big2">'+esc((m.name[0]||"S").toUpperCase())+'</div><h3 class="h3">'+esc(m.name)+'</h3><p class="mut" style="word-break:break-all;margin-bottom:12px">'+esc(user.email||"")+'</p><div class="kv"><span>Chapters done</span><b>'+m.done+'</b></div><div class="kv"><span>Day streak</span><b>'+m.streak+'</b></div><div class="kv"><span>Points</span><b>'+m.pts+'</b></div><button class="go ghost" data-a="out">Log out</button></div>';
}
function render(){
  $("authView").hidden=!!user;$("shell").hidden=!user;
  if(!user)return;
  const body=tab==="syl"?viewSyl():tab==="party"?viewParty():tab==="tasks"?viewTasks():viewMe();
  const nm=user.displayName||"there";
  $("app").innerHTML='<div class="top"><div><h2>'+TITLE[tab]+'</h2><p class="mut">Hi '+esc(nm)+', keep going.</p></div><span class="sync" id="sync">'+esc(sync)+"</span></div>"+body;
  $("nav").innerHTML=NAV.map(([k,l])=>'<button data-a="tab" data-k="'+k+'"'+(tab===k?' aria-current="page"':"")+'><svg viewBox="0 0 24 24" aria-hidden="true">'+ICON[k]+"</svg>"+l+"</button>").join("");
  $("av").textContent=(nm[0]||"S").toUpperCase();$("un").textContent=nm;
  const fr=fresh;$("app").classList.toggle("in",fr);fresh=false;pk="";
  if(fr)document.querySelectorAll("[data-n]").forEach(el=>{const t=+el.dataset.n;let st=null;const f=ts=>{st=st||ts;const q=Math.min((ts-st)/900,1);el.textContent=Math.round(t*(1-Math.pow(1-q,3)));if(q<1)requestAnimationFrame(f)};requestAnimationFrame(f)});
}
function syncLog(){LOG[today()]=TK.filter(x=>x.done).length}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-a]");if(!b||!user)return;
  const a=b.dataset.a,k=b.dataset.k;
  if(a==="tab"){tab=k;fresh=true;pmsg="";window.scrollTo(0,0)}
  else if(a==="cyc"){T[k]=((T[k]||0)+1)%4;pk=k;save();if(T[k]===3)boom()}
  else if(a==="add"){const v=$("tin").value.trim();if(v&&TK.length<50){TK.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),t:v.slice(0,80),done:false,day:today()});save()}}
  else if(a==="tog"){const x=TK.find(t=>t.id===k);if(x){x.done=!x.done;pk=k;syncLog();save();if(x.done&&TK.every(t=>t.done))boom()}}
  else if(a==="del"){TK=TK.filter(t=>t.id!==k);syncLog();save()}
  else if(a==="out"){signOut(auth);return}
  else if(a==="pcreate"){pCreate();return}
  else if(a==="pjoin"){pJoin();return}
  else if(a==="pleave"){pLeave();return}
  else if(a==="prefresh"){loadParty();return}
  else if(a==="pcopy"){if(navigator.clipboard)navigator.clipboard.writeText(PARTY).then(()=>{pmsg="Code copied.";render()},()=>{});return}
  render();
  if(a==="tab"&&k==="party")loadParty();
  if(a==="add"){const i=$("tin");if(i)i.focus()}
});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="tin"){const b=document.querySelector('[data-a="add"]');if(b)b.click()}});
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
  if(u){tab="syl";fresh=true;load(u)}else{T={};TK=[];LOG={};PARTY="";PD=null;render()}
});
