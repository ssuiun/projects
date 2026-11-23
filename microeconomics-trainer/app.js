import {QUESTIONS,CHOICES,TOPICS} from "./questions.js";

const KEY="microstudy_progress_v1";
const fresh=()=>({records:{},attempts:[],lastStudy:null,studyDays:[],settings:{hideFlags:false}});
function load(){try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&typeof v==="object"&&v.records&&Array.isArray(v.attempts))return {...fresh(),...v}}catch{}return fresh()}
let db=load();
let route="home";
let session=null;
let topic="All";
let search="";
let flashRevealed=false;
let practiceSource="all";
let language="en";
const el=document.getElementById("view");
const nav=document.getElementById("nav");
const count=x=>x.length;
const today=()=>new Date().toLocaleDateString("en-CA");
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
function save(){try{localStorage.setItem(KEY,JSON.stringify(db))}catch{ /* blocked storage: app stays usable for this session */ }}
function daysStreak(){const s=new Set(db.studyDays||[]);let d=new Date(),n=0;if(!s.has(today()))d.setDate(d.getDate()-1);for(let i=0;i<400;i++){const k=d.toLocaleDateString("en-CA");if(!s.has(k))break;n++;d.setDate(d.getDate()-1)}return n}
function r(q){return db.records[q.id]||{attempts:0,correct:0,streak:0,interval:0,next:0,last:0}}
function mastered(q){const rec=r(q);return rec.streak>=2}
function due(q){const z=r(q);return z.attempts>0&&z.next<=Date.now()&&z.streak<2}
function wrong(q){const z=r(q);return z.attempts>0&&z.streak===0}
function progress(){return Math.round(100*QUESTIONS.filter(mastered).length/QUESTIONS.length)}
function tap(id,val){return '<button data-action="'+id+'" '+(val?'data-value="'+esc(val)+'"':'')+'>'}
function navItem(slug,ico,title){return '<button class="nav-btn '+(route===slug?"active":"")+'" data-route="'+slug+'"><span class="ico">'+ico+'</span><span>'+title+'</span></button>'}
function header(){nav.innerHTML=[["home","⌂","Главная"],["practice","▦","Тесты"],["flash","▤","Карточки"],["mistakes","↺","Ошибки"],["stats","◴","Прогресс"]].map(z=>navItem(...z)).join("");$("streak").textContent=daysStreak();$("mastery-header").textContent=progress()+"%";const titles={home:"Обзор",practice:"Практика",flash:"Карточки",mistakes:"Работа над ошибками",stats:"Моя статистика",exam:"Экзамен"};$("page-title").textContent=titles[route]||"Обзор"}
function toast(msg){let t=document.createElement("div");t.setAttribute("role","status");t.style.cssText="position:fixed;bottom:88px;left:50%;transform:translateX(-50%);z-index:99;background:#252945;color:#fff;border-radius:13px;padding:13px 18px;font-size:13px;box-shadow:0 8px 30px #2224";t.textContent=msg;document.body.append(t);setTimeout(()=>t.remove(),2400)}
function register(q,value){const ok=value===q.answer;const old=r(q);const streak=ok?(old.streak||0)+1:0;const interval=ok?Math.min(21,streak===1?1:streak===2?3:7):0;db.records[q.id]={attempts:old.attempts+1,correct:old.correct+(ok?1:0),streak,interval,last:Date.now(),next:Date.now()+interval*864e5};db.attempts.push({id:q.id,correct:ok,at:Date.now()});if(db.attempts.length>3000)db.attempts=db.attempts.slice(-3000);if(!db.studyDays.includes(today()))db.studyDays.push(today());db.lastStudy=Date.now();save()}
function pool(){let list=QUESTIONS.filter(q=>topic==="All"||q.topic===topic);if(db.settings.hideFlags)list=list.filter(q=>!q.flag);if(practiceSource==="wrong")list=list.filter(wrong);if(practiceSource==="due")list=list.filter(due);if(practiceSource==="new")list=list.filter(q=>r(q).attempts===0);if(search)list=list.filter(q=>(q.question+" "+q.topic+" "+q.explanation).toLowerCase().includes(search.toLowerCase()));return list}
function statCard(icon,value,title){return '<div class="stat"><div class="stat-icon">'+icon+'</div><strong>'+value+'</strong><span>'+title+'</span></div>'}
function home(){
const studied=QUESTIONS.filter(q=>r(q).attempts).length;
const correct=db.attempts.filter(a=>a.correct).length;
const acc=db.attempts.length?Math.round(100*correct/db.attempts.length):0;
return '<section class="hero"><div class="copy"><span class="tag">✦ ТВОЙ ПЕРСОНАЛЬНЫЙ ТРЕНАЖЁР</span><h1>Маленькие шаги.<br/>Большой результат.</h1><p>40 вопросов из настоящего пробника. Учись в своём темпе, повторяй ошибки и приходи на экзамен уверенно.</p><button data-route="practice">Начать тренировку ↗</button></div><div class="orb"></div></section>'+
'<div class="section-header"><h2>Твой прогресс</h2><span class="hint">Сохраняется автоматически</span></div><div class="stats">'+statCard("▣",studied+"/40","Вопросов изучено")+statCard("◎",acc+"%","Точность ответов")+statCard("✓",QUESTIONS.filter(mastered).length,"Освоено (2+ подряд)")+statCard("↺",QUESTIONS.filter(due).length,"На повторение")+'</div>'+
'<div class="section-header"><h2>Режимы обучения</h2><span class="hint">Выбери удобный формат</span></div><div class="cards-grid">'+
mode("practice","✎","Быстрый тест","Варианты A–D и True/False с объяснениями.","Решать вопросы")+
mode("flash","▤","Карточки","Вспомни ответ, переверни и оцени себя.","Учить карточки")+
mode("exam","◷","Пробный экзамен","40 случайных вопросов на время — 45 минут.","Начать экзамен")+
mode("mistakes","↺","Мои ошибки","Автоматический список заданий для повторения.","Повторить")+
mode("stats","◫","Статистика","Посмотри свои сильные и слабые темы.","Открыть отчёт")+
mode("practice","✦","Умное повторение","Повторяй материал с интервалами в 1, 3 и 7 дней.","Начать", "due")+
'</div><div class="footer-note">Источник заданий — 2 фотографии пробного экзамена по Microeconomics. №26 имеет обрезанный вариант D; №34 спорен из-за слова always. Они помечены ⚠. Расчётные задачи и эссе в этот тренажёр не входят.</div>'}
function mode(route,ico,title,descr,link,source){return '<button class="mode-card" data-route="'+route+'" '+(source?'data-source="'+source+'"':'')+'><div class="mode-icon">'+ico+'</div><h3>'+title+'</h3><p>'+descr+'</p><span class="go">'+link+' →</span></button>'}
function topicSelect(){return '<select id="topic-filter" aria-label="Выбрать тему"><option value="All">Все темы</option>'+TOPICS.map(t=>'<option '+(topic===t?"selected":"")+' value="'+esc(t)+'">'+esc(t)+'</option>').join("")+'</select>'}
function sourceSelect(){return '<select id="source-filter" aria-label="Подбор вопросов">'+[["all","Все вопросы"],["new","Новые"],["wrong","С ошибками"],["due","Пора повторить"]].map(([v,n])=>'<option value="'+v+'" '+(v===practiceSource?"selected":"")+'>'+n+'</option>').join("")+'</select>'}
function topicTags(){return '<div class="toolbar">'+topicSelect()+sourceSelect()+'<input id="search-filter" placeholder="Поиск по вопросу или теме..." value="'+esc(search)+'" aria-label="Поиск"/></div>'}
function start(mode,source){if(source)practiceSource=source;let qs=pool();if(mode==="exam"){qs=shuffle(QUESTIONS.filter(q=>!db.settings.hideFlags||!q.flag));topic="All";practiceSource="all";search=""}
if(!qs.length){session=null;toast("В этой подборке пока нет вопросов");return}
session={mode,questions:mode==="exam"?qs:shuffle(qs),index:0,selected:null,revealed:false,answers:{},started:Date.now(),deadline:mode==="exam"?Date.now()+45*60*1000:0,finished:false,score:0};
flashRevealed=false;
route=mode==="flash"?"flash":mode==="exam"?"exam":"practice";render()}
function current(){return session?.questions[session.index]}
function option(q,v,i,locked){const correct=locked&&v===q.answer?"correct":"";const chosen=session.selected===v;const wrongAns=locked&&chosen&&v!==q.answer?"wrong":"";const label=q.type==="tf"?(v==="T"?"True":"False"):q.options[i];return '<button class="option '+(chosen?"selected ":"")+correct+" "+wrongAns+'" data-answer="'+v+'" '+(locked?"disabled":"")+'><span class="letter">'+v+'</span><span>'+esc(label)+'</span></button>'}
function questionView(){
const q=current();if(!q)return '<div class="empty">Вопросы не найдены</div>';
const isExam=session.mode==="exam";
const already=isExam?Object.hasOwn(session.answers,q.id):session.revealed;
const opts=q.type==="tf"?["T","F"]:CHOICES;
let content='<div class="quiz-card"><div class="quiz-head"><div class="kicker">'+esc(q.topic)+' · '+(q.type==="tf"?"TRUE / FALSE":"MULTIPLE CHOICE")+'</div><span class="pill">'+(session.index+1)+' / '+session.questions.length+'</span></div>';
content+='<div class="progress-track"><div class="progress-bar" style="width:'+Math.round(100*(session.index+1)/session.questions.length)+'%"></div></div>';
content+='<div class="question">'+esc(q.question)+'</div>';
content+='<div>'+opts.map((v,i)=>option(q,v,i,!isExam&&already)).join("")+'</div>';
if(q.flag)content+='<div class="notice">⚠ '+(q.flag==="ambiguous"?"В оригинале часть варианта D не видна. Ответ требует уточнения.":"Формулировка содержит оговорку. Подробности после ответа.")+'</div>';
if(!isExam&&already)content+='<div class="answer-box '+(session.selected===q.answer?"":"bad")+'"><strong>'+(session.selected===q.answer?"✓ Верно!":"✕ Пока не получилось. Правильный ответ: "+q.answer)+'</strong><p>'+esc(q.explanation)+'</p></div>';
content+='<div class="quiz-footer"><button class="secondary" data-action="prev" '+(session.index===0?"disabled":"")+'>← Назад</button><button class="primary" data-action="'+(isExam?"next":already?"next":"check")+'" '+(!isExam&&!already&&!session.selected?"disabled":"")+'>'+(session.index===session.questions.length-1?"Завершить":(isExam||already)?"Следующий →":"Проверить ответ")+'</button></div>';
content+='</div>';
if(isExam)content='<div class="toolbar" style="max-width:780px;margin-left:auto;margin-right:auto"><span class="pill">Симуляция экзамена</span><span id="clock" class="exam-clock">45:00</span><button data-action="finish" class="secondary tiny" style="margin-left:auto">Завершить сейчас</button></div>'+content;
return content}
function flashView(){const q=current();if(!q)return '<div class="empty">Нет вопросов</div>';return '<div class="toolbar"><span class="pill">Карточка '+(session.index+1)+' / '+session.questions.length+'</span><span class="hint">Нажми на карточку, чтобы перевернуть</span></div><div class="quiz-card"><div class="flip-card" data-action="flip" role="button" tabindex="0" aria-label="Перевернуть карточку">'+(flashRevealed?'<div class="kicker">ПРАВИЛЬНЫЙ ОТВЕТ</div><div class="answer">'+(q.type==="tf"?(q.answer==="T"?"True":"False"):q.answer+". "+esc(q.options[CHOICES.indexOf(q.answer)]))+'</div><p class="hint" style="max-width:520px;margin:16px auto">'+esc(q.explanation)+'</p>':'<div class="kicker">'+esc(q.topic)+'</div><h2 style="max-width:570px;margin:22px auto">'+esc(q.question)+'</h2><p class="hint">Нажми, чтобы увидеть ответ ↻</p>')+'</div>'+
(q.flag?'<div class="notice">⚠ Требует внимания: неоднозначная формулировка на пробнике.</div>':'')+
'<div class="quiz-footer" style="justify-content:center">'+(flashRevealed?'<button class="secondary" data-action="flash-wrong">↺ Повторить</button><button class="primary" data-action="flash-correct">✓ Я знаю</button>':'<button class="primary" data-action="flip">Показать ответ ↗</button>')+'</div></div>'}
function finish(){if(!session)return;session.finished=true;let answered=Object.keys(session.answers).length;let score=Object.entries(session.answers).filter(([id,value])=>session.questions.find(q=>q.id===id)?.answer===value).length;session.score=score;session.total=answered;render()}
function completed(){const isExam=session.mode==="exam";const total=isExam?session.questions.length:session.questions.length;const score=isExam?session.score:session.score;const percentage=Math.round(100*score/total)||0;
return '<div class="panel center" style="max-width:680px;margin:auto;padding:45px 25px"><div class="stat-icon" style="margin:0 auto 15px">✦</div><div class="eyebrow">ТРЕНИРОВКА ЗАВЕРШЕНА</div><div class="result-big">'+percentage+'%</div><h2>'+(percentage>=80?"Отличная работа!":percentage>=50?"Хорошее начало!":"Есть над чем поработать")+'</h2><p class="hint">Правильных ответов: '+score+' из '+total+'. '+(isExam?"Экзамен завершён.":"Продолжай повторение, особенно сложных вопросов.")+'</p><div class="shortcut" style="justify-content:center;margin-top:24px"><button class="secondary" data-route="home">На главную</button><button class="primary" data-action="restart">Пройти ещё раз ↗</button></div></div>'}
function practice(){if(!session||session.mode!=="practice"||session.finished){if(session?.finished&&session.mode==="practice")return completed();return '<div class="panel"><h2>Режим практики</h2><p class="hint">Отвечай на вопросы, затем читай объяснение на русском. Подборка запоминает твои слабые места.</p>'+topicTags()+'<button class="primary" data-action="start-practice">Начать тренировку →</button><p class="hint" style="margin-top:13px">'+pool().length+' вопросов в подборке</p></div>'}return questionView()}
function flash(){if(!session||session.mode!=="flash"||session.finished){if(session?.finished&&session.mode==="flash")return completed();return '<div class="panel"><h2>Карточки для запоминания</h2><p class="hint">Сначала вспомни ответ самостоятельно, затем открой его и отметь, знаешь ли вопрос.</p>'+topicTags()+'<button class="primary" data-action="start-flash">Учить карточки →</button><p class="hint" style="margin-top:13px">'+pool().length+' карточек доступно</p></div>'}return flashView()}
function exam(){if(!session||session.mode!=="exam")return '<div class="panel" style="max-width:680px"><h2>Пробный экзамен</h2><p class="hint">40 вопросов, 45 минут, без объяснений до завершения. Официальный пробник рассчитан на 100 минут вместе с расчётами и эссе; здесь только тестовая часть.</p><div class="notice">Примечание: спорные вопросы помечены ⚠. Отвечай самостоятельно, без подсказок.</div><button class="primary" data-action="start-exam">Начать экзамен →</button></div>';return session.finished?completed():questionView()}
function mistakes(){const qs=QUESTIONS.filter(wrong);return '<div class="section-header"><h2>Вопросы для повторения</h2><span class="pill">'+qs.length+' вопросов</span></div><div class="panel">'+(!qs.length?'<div class="empty"><div style="font-size:35px">✧</div><b>Ошибок пока нет</b>После неправильных ответов вопросы появятся здесь.</div>':'<div class="review-list">'+qs.map(q=>'<div class="review-item"><div><b>'+esc(q.question)+'</b><p>'+esc(q.topic)+'</p></div><span class="pill">№ '+esc(q.originalNumber)+'</span></div>').join("")+'</div><div style="margin-top:20px"><button class="primary" data-action="start-mistakes">Повторить ошибки →</button></div>')+'</div>'}
function stats(){const studied=QUESTIONS.filter(q=>r(q).attempts).length;const total=db.attempts.length;const accuracy=total?Math.round(100*db.attempts.filter(x=>x.correct).length/total):0;return '<div class="stats">'+statCard("▣",studied+"/40","Открытые вопросы")+statCard("✓",accuracy+"%","Доля правильных попыток")+statCard("✦",progress()+"%","Освоение базы")+statCard("🔥",daysStreak(),"Дней подряд")+'</div><div class="section-header"><h2>Успехи по темам</h2></div><div class="layout-split"><div class="panel">'+TOPICS.map(t=>{const qs=QUESTIONS.filter(q=>q.topic===t);const m=qs.filter(mastered).length;return '<div class="topic-row"><div class="topic-detail"><div style="display:flex;justify-content:space-between;gap:10px"><span class="topic-title">'+esc(t)+'</span><span class="topic-stat">'+m+'/'+qs.length+'</span></div><div class="topic-bar"><div class="topic-fill" style="width:'+(m*100/qs.length)+'%"></div></div></div></div>'}).join("")+'</div><div class="panel"><h3>План повторений</h3><p class="hint">Алгоритм: правильный ответ → через 1 день; повторный правильный → через 3 дня; далее — через 7 и 21 день. Ошибка сбрасывает интервал.</p><div style="font-size:38px;font-weight:800;margin:20px 0;color:#6054e8">'+QUESTIONS.filter(due).length+'</div><p class="hint">Карточек пора повторить</p><button class="primary" data-action="smart" style="width:100%;margin-top:12px">Повторить сейчас →</button></div></div><div class="section-header"><h2>Данные и настройки</h2></div><div class="panel"><label style="display:flex;gap:10px;align-items:center;font-size:13px"><input type="checkbox" id="hide-flags" '+(db.settings.hideFlags?"checked":"")+'/> Исключить 2 спорных вопроса из тренировок</label><p class="hint">Прогресс хранится только в этом браузере. На другом телефоне или в режиме инкогнито он не появится автоматически.</p><div class="shortcut"><button class="secondary tiny" data-action="export">Экспорт прогресса (JSON)</button><button class="secondary tiny" data-action="import">Импорт прогресса</button><button class="secondary tiny" data-action="reset">Сбросить всё</button></div><input type="file" id="import-input" accept=".json,application/json" hidden/></div>'}
function render(){header();el.innerHTML=route==="home"?home():route==="practice"?practice():route==="flash"?flash():route==="exam"?exam():route==="mistakes"?mistakes():stats();if(route==="exam")updateClock()}
function next(){if(!session)return;if(session.index===session.questions.length-1){finish();return}session.index++;session.selected=session.mode==="exam"?(session.answers[current().id]||null):null;session.revealed=false;flashRevealed=false;render()}
function prev(){if(!session||session.index===0)return;session.index--;session.selected=session.mode==="exam"?(session.answers[current().id]||null):null;session.revealed=session.mode!=="exam"&&!!session.answers[current().id];render()}
function check(){if(!session?.selected||session.revealed)return;const q=current();session.revealed=true;session.answers[q.id]=session.selected;session.score+=(q.answer===session.selected?1:0);register(q,session.selected);render()}
function flip(){flashRevealed=!flashRevealed;render()}
function flashGrade(ok){if(!session)return;const q=current();if(!flashRevealed)return;register(q,ok?q.answer:(q.answer==="A"?"B":"A"));session.score+=ok?1:0;session.answers[q.id]=ok;next()}
function updateClock(){if(route!=="exam"||!session||session.mode!=="exam"||session.finished)return;const left=Math.max(0,session.deadline-Date.now());const n=Math.ceil(left/1000);const clock=$("clock");if(clock){clock.textContent=Math.floor(n/60)+":"+String(n%60).padStart(2,"0");clock.classList.toggle("urgent",n<300)}if(left<=0){recordExam();finish()}}
function recordExam(){if(!session||session.examRecorded)return;session.examRecorded=true;for(const q of session.questions){if(session.answers[q.id])register(q,session.answers[q.id])}}
document.addEventListener("click",e=>{
const b=e.target.closest("[data-route],[data-action],[data-answer]");if(!b)return;
if(b.dataset.route){route=b.dataset.route;session=null;if(b.dataset.source)practiceSource=b.dataset.source;render();window.scrollTo(0,0);return}
if(b.dataset.answer){if(!session||session.finished)return;const q=current();if(session.mode==="exam"){session.answers[q.id]=b.dataset.answer;session.selected=b.dataset.answer;render()}else if(!session.revealed){session.selected=b.dataset.answer;render()}return}
const action=b.dataset.action;
if(action==="start-practice"){start("practice");return}if(action==="start-flash"){start("flash");return}if(action==="start-exam"){start("exam");return}if(action==="start-mistakes"){topic="All";search="";practiceSource="wrong";start("practice");return}if(action==="smart"){topic="All";search="";practiceSource="due";start("flash");return}
if(action==="flip"){flip();return}if(action==="flash-wrong"){flashGrade(false);return}if(action==="flash-correct"){flashGrade(true);return}if(action==="check"){check();return}if(action==="next"){next();return}if(action==="prev"){prev();return}if(action==="finish"){if(confirm("Завершить пробный экзамен?")){recordExam();finish()}return}
if(action==="restart"){start(session?.mode||"practice");return}
if(action==="export"){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="microstudy-progress.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return}
if(action==="import"){$("import-input")?.click();return}
if(action==="reset"){if(confirm("Удалить все ответы, историю и прогресс на этом устройстве?")){db=fresh();save();render()}return}
});
document.addEventListener("change",async e=>{if(e.target.id==="topic-filter"){topic=e.target.value;render()}else if(e.target.id==="source-filter"){practiceSource=e.target.value;render()}else if(e.target.id==="hide-flags"){db.settings.hideFlags=e.target.checked;save();render()}else if(e.target.id==="import-input"){const f=e.target.files?.[0];if(!f)return;try{const parsed=JSON.parse(await f.text());if(!parsed.records||!Array.isArray(parsed.attempts)||!Array.isArray(parsed.studyDays))throw Error("Invalid data");if(!confirm("Заменить текущий прогресс содержимым файла?"))return;db={...fresh(),...parsed};save();toast("Прогресс импортирован");render()}catch{toast("Файл прогресса повреждён или имеет неверный формат")}}});
document.addEventListener("input",e=>{if(e.target.id==="search-filter"){search=e.target.value;const cursor=e.target.selectionStart;render();const n=$("search-filter");n?.focus();n?.setSelectionRange(cursor,cursor)}});
document.addEventListener("keydown",e=>{if(e.target.closest(".flip-card")&&(e.key==="Enter"||e.key===" ")){e.preventDefault();flip()}});
setInterval(updateClock,1000);
render();
