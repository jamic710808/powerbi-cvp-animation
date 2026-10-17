/* 《賣多少，才不虧？》九個場景。每一幀都由 drawScene(c,{scene,time,...}) 決定（時間的純函式）。
   旁白時點以「關鍵字 → 該句開始秒數」對應（cue），句長按字數比例估計，已用 silencedetect 抽驗誤差約 0.1–0.3 秒。 */
(() => {
  const {C,FONT,clamp,lerp,seg,eIO,eO,eOB,hash,rr,box,circ,text,tag,bubble,person,handPos,cooker,profitStar,bucket,flag,cloud,screenFrame,crop,ptr,magnifier}=window.P;
  const W=1920,H=1080,IMG=[];
  const CL={};
  function clauses(s){
    if(CL[s.id])return CL[s.id];
    const parts=s.narration.split(/(?<=[，。？：；])/).map(x=>x.trim()).filter(Boolean);
    const len=p=>p.replace(/[，。？：；\s]/g,'').length,tot=parts.reduce((a,p)=>a+len(p),0);
    const a=(s.voiceStartFrame-s.startFrame)/30,V=s.voiceFrames/30;let acc=0;
    return CL[s.id]=parts.map(p=>{const t0=a+V*acc/tot;acc+=len(p);return {t0,t1:a+V*acc/tot,text:p};});
  }
  // 關鍵字 → 該句起點（秒，相對場景起點）；找不到就報錯，不靜默退回
  function mkcue(s){return (key,off=0)=>{const c=clauses(s).find(x=>x.text.includes(key));if(!c)throw Error(`${s.id}: 找不到旁白關鍵字「${key}」`);return c.t0+off;};}

  /* ---------- 共用背景 ---------- */
  function room(c,o={}){
    const {sunset=0}=o;
    const g=c.createLinearGradient(0,0,0,760);g.addColorStop(0,C.wall);g.addColorStop(1,C.wall2);c.fillStyle=g;c.fillRect(0,0,W,H);
    c.fillStyle=C.floor;c.fillRect(0,740,W,340);c.fillStyle='rgba(0,0,0,.06)';c.fillRect(0,740,W,10);
    // 牆上裝飾線
    c.fillStyle='rgba(120,90,50,.07)';c.fillRect(0,600,W,6);
    if(sunset>0){ // 窗外夕陽
      box(c,90,110,300,420,18,'#fff6e8',C.ink,6);
      const sg=c.createLinearGradient(0,130,0,510);sg.addColorStop(0,'#ffd9a0');sg.addColorStop(1,'#f59a62');
      c.save();rr(c,110,130,260,380,10);c.clip();c.globalAlpha=sunset;c.fillStyle=sg;c.fillRect(110,130,260,380);circ(c,240,430,70,'#fff1c9');
      c.fillStyle='rgba(120,70,60,.55)';for(let i=0;i<5;i++){c.fillRect(120+i*52,420-hash(i)*120,38,200);}
      c.restore();c.strokeStyle=C.ink;c.lineWidth=6;c.beginPath();c.moveTo(240,130);c.lineTo(240,510);c.moveTo(110,320);c.lineTo(370,320);c.stroke();
    }
  }
  function table(c,y=740){
    box(c,-20,y,W+40,40,0,'#d9aa73');c.fillStyle='#c4925c';c.fillRect(-20,y+40,W+40,H-y);
    c.fillStyle='rgba(255,255,255,.25)';c.fillRect(-20,y,W+40,8);
  }
  function wipe(c,s,f){ // 場景之間的橘色橫掃：上一場景末 6 幀掃入、下一場景前 6 幀掃出，運動連續
    const n=7;
    if(f<n&&s.id!=='s01'){const p=eIO(f/n);c.fillStyle=C.orange;c.fillRect(p*W,0,W-p*W,H);c.fillStyle=C.navy;c.fillRect(p*W,0,18,H);}
    const left=s.durationFrames-1-f;
    if(left<n&&s.id!=='s09'){const p=eIO(1-left/n);c.fillStyle=C.orange;c.fillRect(0,0,p*W,H);c.fillStyle=C.navy;c.fillRect(p*W-18,0,18,H);}
  }
  function spot(c,rect,alpha=1,col=C.orange){ // 暗化四周並框出矩形
    const [x,y,w,h]=rect;c.save();c.globalAlpha=alpha;c.fillStyle='rgba(20,30,55,.35)';
    c.beginPath();c.rect(0,0,W,H);rr(c,x,y,w,h,12);c.fill('evenodd');c.restore();
    c.save();c.globalAlpha=alpha;rr(c,x,y,w,h,12);c.strokeStyle=col;c.lineWidth=6;c.stroke();c.restore();
  }

  /* ---------- S01 月會 ---------- */
  function s01(c,t,s,q){
    room(c);
    // 牆上螢幕與折線
    const f=screenFrame(c,520,100,880,480,{pad:16});
    box(c,f.x,f.y,f.w,f.h,12,'#fffdf7');
    c.strokeStyle='#e3dccb';c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(f.x+50,f.y+60+i*80);c.lineTo(f.x+f.w-40,f.y+60+i*80);c.stroke();}
    text(c,'每月銷售額與利潤',f.x+f.w/2,f.y+36,{size:30,color:C.grey});
    const d1=eIO(seg(t,1.0,3.0)),d2=eIO(seg(t,3.8,5.4));
    const sales=i=>f.y+f.h-70-i*26-Math.sin(i*1.7)*10, prof=i=>f.y+f.h-150+Math.sin(i*2.3)*8;
    const line=(fn,d,col)=>{c.strokeStyle=col;c.lineWidth=9;c.lineCap='round';c.lineJoin='round';c.beginPath();const n=Math.floor(d*12);for(let i=0;i<=n;i++){const x=f.x+70+i*(f.w-140)/12,y=fn(i);i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();};
    line(sales,d1,C.green);line(prof,d2,C.orange);
    if(d1>.95)text(c,'銷售額 ↗',f.x+f.w-130,f.y+110,{size:34,color:C.green,alpha:seg(t,2.6,3.2)});
    if(d2>.95)text(c,'利潤 →',f.x+f.w-130,f.y+f.h-190,{size:34,color:C.orange,alpha:seg(t,5.3,5.9)});
    // 人物
    const qh=q('他問了兩個問題'),q5=q('利潤怎麼沒跟著漲'),q6=q('下個月');
    const zhou={x:300,y:740,s:1.05,who:'zhou',t,look:1,handL:[50,-130],handR:[-50,-130],mood:t>q5?'shock':(t>qh?'think':'worry')};
    person(c,zhou);
    person(c,{x:1620,y:740,s:1.05,who:'qi',t,look:-1,handL:[-130,-70],handR:[-26,-160],prop:'coffee',mood:t>q('利潤卻原地踏步')?'calm':'happy'});
    table(c);
    // 問號
    for(let i=0;i<3;i++){const st=qh+i*.25;if(t>st)text(c,'？',230+i*95,300-eOB(seg(t,st,st+.4))*24-Math.sin(t*4+i)*5,{size:84,color:C.coral,alpha:clamp((t-st)*4)*(t<q6?1:.0)});}
    // 氣泡
    bubble(c,'',400,170,{lines:['營業額都漲了，','錢呢？'],size:44,pop:t>qh&&t<q6-.2?seg(t,qh,qh+.35):(t>=q6-.2?1-seg(t,q6-.2,q6):0),tx:340,ty:300});
    bubble(c,'',470,160,{lines:['下個月，至少要做多少','才不虧？'],size:44,pop:seg(t,q6,q6+.35),tx:350,ty:300});
    // 片名卡
    const tt=t<2.3?(t<.25?eOB(t/.25):1)*(1-seg(t,1.7,2.3)):0;
    if(tt>0){c.save();c.globalAlpha=clamp(tt*2);c.translate(W/2,430);c.scale(.9+.1*tt,.9+.1*tt);
      box(c,-560,-170,1120,340,44,C.cream,C.ink,8);text(c,'賣多少，才不虧？',0,-30,{size:130,color:C.navy});
      tag(c,'Power BI 量本利分析報告',0,100,{size:42,bg:C.orange});c.restore();}
  }

  /* ---------- S02 量價本利：水桶 ---------- */
  function s02(c,t,s,q){
    room(c);
    // 白板
    box(c,170,60,1580,780,28,'#ffffff',C.ink,8);
    const cq=q('量、價、本、利'),ceq=q('銷量乘單價'),cb=q('成本分兩種'),cvar=q('材料人工'),cfix=q('租金折舊'),c100=q('每賣一百元'),cpay=q('先付變動成本'),ccm=q('剩下的邊際貢獻'),c307=q('八月是三十點七元'),cfill=q('要先把固定費用'),cprof=q('才輪到利潤'),clast=q('利潤，'),cclient=q('永遠是最後一個到的客人');
    // 標題四字
    const T=[['量','銷量',C.blue],['價','單價',C.gold],['本','成本',C.coral],['利','利潤',C.mint]];
    T.forEach((a,i)=>{const st=cq+i*.35,k=eOB(seg(t,st,st+.45));if(k<=0)return;
      const x=960+(i-1.5)*250,y=118,r=48;c.save();c.translate(x,y);c.scale(k,k);circ(c,0,0,r,a[2],C.ink,5);text(c,a[0],0,2,{size:62,color:C.white});c.restore();
      text(c,a[1],x,y+68,{size:26,color:C.grey,alpha:clamp(k)});});
    // 量 × 價 ＝ 收入
    const eqA=seg(t,ceq,ceq+.4)*(1-seg(t,cb-.3,cb+.1));
    if(eqA>0){c.save();c.globalAlpha=eqA;text(c,'量  ×  價  ＝  收入',960,290,{size:64,color:C.navy});circ(c,1320,290,24,C.gold,C.ink,4);text(c,'$',1320,292,{size:28,color:C.ink});c.restore();}
    // 水龍頭
    const stream0=c100,streamEnd=ccm+.9;
    c.strokeStyle='#7d8aa3';c.lineWidth=34;c.lineCap='round';c.beginPath();c.moveTo(260,305);c.lineTo(520,305);c.lineTo(520,350);c.stroke();
    circ(c,300,262,22,C.coral,C.ink,5);c.strokeStyle=C.ink;c.lineWidth=6;c.beginPath();c.moveTo(300,284);c.lineTo(300,305);c.stroke();
    if(t>c100-.2)tag(c,'每賣 100 元收入',290,205,{size:30,bg:C.blue,alpha:seg(t,c100-.2,c100+.2)});
    // 水桶 A（變動成本）與 B（固定費用／利潤）
    const aF=.693*eIO(seg(t,cpay,ccm+.3));
    const bOr=.86*eIO(seg(t,cfill,cfill+3.0)), bMint=.14*eIO(seg(t,cprof,cprof+1.2));
    const showBuckets=seg(t,cb,cb+.5);
    c.save();c.globalAlpha=showBuckets;
    bucket(c,{x:520,y:400,w:300,h:290,fills:[{f:aF,color:C.blue}],label:'變動成本',labelColor:C.blue});
    bucket(c,{x:1060,y:360,w:470,h:330,fills:[{f:bOr,color:C.orange},{f:bMint,color:C.mint}],label:'固定費用',labelColor:C.orange});
    c.restore();
    if(t>cpay+1.2)text(c,'約 69.3 元（推算）',520,790,{size:30,color:C.blue,alpha:seg(t,cpay+1.2,cpay+1.8)});
    if(t>cfill+2.4)text(c,'固定費用 約 26.4（推算）',1060,790,{size:30,color:C.orange,alpha:seg(t,cfill+2.4,cfill+3.0)});
    if(t>cprof+.6){const a=seg(t,cprof+.6,cprof+1.2);text(c,'利潤 約 4.4（推算）',1060,388,{size:28,color:C.white,alpha:a});}
    // 說明標籤
    if(t>cvar)tag(c,'材料・人工：跟著銷量走',340,372,{size:26,bg:C.blueL,color:C.navy,alpha:seg(t,cvar,cvar+.3)});
    if(t>cfix)tag(c,'租金・折舊：賣多賣少都要付',1060,300,{size:26,bg:C.orangeL,color:C.ink,alpha:seg(t,cfix,cfix+.3)*(1-seg(t,cprof-.5,cprof))});
    // 水流
    if(t>stream0&&t<streamEnd){
      const surf=690-290*aF;c.strokeStyle=C.blue;c.lineWidth=18;c.lineCap='round';c.globalAlpha=.9;c.beginPath();c.moveTo(520,350);c.lineTo(520,Math.max(400,surf));c.stroke();c.globalAlpha=1;
    }
    // 溢流管：A → B
    const pipe=seg(t,ccm,ccm+.5);
    if(pipe>0){
      c.save();c.globalAlpha=pipe;c.strokeStyle='#c4925c';c.lineWidth=26;c.lineCap='round';c.beginPath();c.moveTo(680,415);c.bezierCurveTo(790,350,850,330,930,372);c.stroke();
      c.strokeStyle=C.ink;c.lineWidth=4;c.stroke();
      const flowOn=t>ccm&&t<cfill+3.2;
      if(flowOn)for(let i=0;i<6;i++){const u=((t*1.1+i/6)%1);const bx=lerp(680,930,u),by=lerp(415,372,u)-Math.sin(u*Math.PI)*55;circ(c,bx,by,9,C.mint);}
      c.restore();
      tag(c,'邊際貢獻 30.7 元',770,250,{size:28+9*Math.sin(clamp(seg(t,c307,c307+.5))*Math.PI),bg:C.mint,alpha:pipe});
    }
    // 利潤星星：最後一個到的客人
    if(t>clast){const u=seg(t,clast,clast+1.3),x=lerp(1850,1090,eIO(u)),y=300-Math.sin(u*Math.PI)*110;
      profitStar(c,{x,y:y-8,s:.62,t,rot:Math.sin(t*3)*.08*(1-u),wave:u>.9?1:0});
      if(t>cclient)tag(c,'最後一個到的客人',1530,210,{size:30,bg:C.gold,color:C.ink,alpha:seg(t,cclient,cclient+.3)});}
    // 小琪（拿馬克筆）
    person(c,{x:1590,y:850,s:.6,who:'qi',t,look:-1,handL:[-120,-50],handR:[-60,-250],prop:'marker',mood:'happy'});
    box(c,170,838,1580,30,10,'#b98a5a');
  }

  /* ---------- S03 保本線 ---------- */
  function s03(c,t,s,q){
    room(c);
    box(c,100,70,1190,770,34,C.white,C.ink,7);
    const X=v=>210+v/2000*990, Y=v=>740-v/2000*570;
    c.strokeStyle='#e5e7ee';c.lineWidth=2;c.fillStyle=C.grey;
    for(let v=0;v<=2000;v+=500){c.beginPath();c.moveTo(X(0),Y(v));c.lineTo(X(2000),Y(v));c.stroke();text(c,v.toLocaleString(),X(0)-18,Y(v),{size:24,color:C.grey,align:'right',weight:600});text(c,v.toLocaleString(),X(v),Y(0)+30,{size:24,color:C.grey,weight:600});}
    text(c,'月銷售額（萬元）',X(1000),Y(0)+64,{size:28,color:C.grey,weight:700});
    const c1=q('就是收入剛好'),cF=q('固定費用，'),c4=q('三百七十四'),c5=q('約一千二百一十七'),c6=q('這個月計畫'),c7=q('營收下滑'),c9=q('老闆低頭'),c10=q('我離懸崖'),c12=q('對，');
    const bx=1217,py=1217,plan=1418;
    const dRev=eIO(seg(t,c1-.3,c1+2.2)),dCost=eIO(seg(t,c1+.4,c1+2.8));
    // 區域色塊（保本後）
    const ar=seg(t,c5,c5+.8);
    if(ar>0){c.save();c.globalAlpha=ar*.55;
      c.beginPath();c.moveTo(X(0),Y(0));c.lineTo(X(bx),Y(bx));c.lineTo(X(0),Y(374));c.closePath();c.fillStyle='#f9c9bf';c.fill();
      c.beginPath();c.moveTo(X(bx),Y(bx));c.lineTo(X(2000),Y(2000));c.lineTo(X(2000),Y(374+.693*2000));c.closePath();c.fillStyle=C.mintL;c.fill();c.restore();
      text(c,'虧損區',X(560),Y(640),{size:30,color:C.coral,alpha:ar});
      c.strokeStyle=C.green;c.lineWidth=4;c.globalAlpha=ar;c.beginPath();c.moveTo(X(1500),Y(1700));c.lineTo(X(1760),Y(1668));c.stroke();c.globalAlpha=1;tag(c,'盈利區',X(1400),Y(1760),{size:30,bg:C.green,alpha:ar});}
    const stroke=(x0,y0,x1,y1,col,d)=>{c.strokeStyle=col;c.lineWidth=9;c.lineCap='round';c.beginPath();c.moveTo(X(x0),Y(y0));c.lineTo(X(lerp(x0,x1,d)),Y(lerp(y0,y1,d)));c.stroke();};
    stroke(0,0,2000,2000,C.green,dRev);stroke(0,374,2000,374+.693*2000,C.coral,dCost);
    if(dRev>.9)text(c,'收入',X(1930),Y(1930)-40,{size:34,color:C.green,alpha:seg(t,c1+1.8,c1+2.4)});
    if(dCost>.9)text(c,'總成本',X(1965),Y(374+.693*1965)+62,{size:30,color:C.coral,alpha:seg(t,c1+2.4,c1+3)});
    if(dCost>.5)text(c,'固定費用 374',X(0)+110,Y(374)-26,{size:28,color:C.coral,alpha:seg(t,cF,cF+.4)});
    // 保本點
    if(t>c5){const k=eOB(seg(t,c5,c5+.4));circ(c,X(bx),Y(py),18*k+Math.sin(t*6)*2,C.navy,C.white,5);
      c.save();c.strokeStyle=C.navy;c.lineWidth=4;c.setLineDash([10,9]);c.beginPath();c.moveTo(X(bx),Y(py));c.lineTo(X(bx),Y(0));c.stroke();c.restore();
      tag(c,'保本 1,217 萬',X(bx)-110,Y(py)-60,{size:32,bg:C.navy,alpha:seg(t,c5+.2,c5+.6)});}
    // 計畫旗與安全邊際橋
    if(t>c6)flag(c,{x:X(plan),y:Y(0),h:Y(0)-Y(plan)+40,txt:'計畫 1,418 萬',color:C.blue,t,grow:eO(seg(t,c6,c6+.7)),size:28});
    if(t>c7){const a=seg(t,c7,c7+.6);c.save();c.globalAlpha=a;c.strokeStyle=C.orange;c.lineWidth=14;c.lineCap='round';c.beginPath();c.moveTo(X(bx)+6,Y(0)-34);c.lineTo(X(plan)-6,Y(0)-34);c.stroke();c.restore();
      tag(c,'安全邊際 約 201 萬 · −14.2%',(X(bx)+X(plan))/2+20,Y(0)-92,{size:28,bg:C.orange,alpha:a});}
    // 右側公式卡
    box(c,1320,70,540,370,30,C.cream,C.ink,6);
    const tx=(str,y,sz,t0,col)=>text(c,str,1590,y,{size:sz,color:col||C.ink,alpha:seg(t,t0,t0+.4),maxW:500});
    tx('保本營收',112,32,cF-.1,C.grey);tx('＝ 固定費用 ÷ 邊際貢獻率',162,38,q('除以邊際貢獻率'),C.navy);
    tx('374 ÷ 30.7% ≈ 1,217 萬',235,44,c4,C.green);
    text(c,'報表顯示 1,217（貢獻率為四捨五入，手算約 1,218）',1590,280,{size:20,weight:600,color:C.grey,alpha:seg(t,c5+.3,c5+.8),maxW:500});
    tx('安全邊際率 ＝ (1,418 − 1,217) ÷ 1,418',335,28,c7,C.navy);tx('＝ 14.2%',385,40,c7+.6,C.orange);
    // 人物
    if(t>c9-.3){const u=eO(seg(t,c9-.3,c9+.5));
      c.save();c.globalAlpha=u;
      person(c,{x:1480+(1-u)*200,y:850,s:.7,who:'zhou',t,look:-.5,handL:[60,-120],handR:[-30,-130],mood:t>c10?'think':'worry'});
      if(t>c12-.4)person(c,{x:1730,y:850,s:.7,who:'qi',t,look:-1,handL:[-110,-70],handR:[-30,-150],prop:'coffee',mood:'happy'});
      c.restore();}
    box(c,1320,850,560,34,10,'#b98a5a');
    bubble(c,'',1500,500,{lines:['我離懸崖還有','十四個百分點？'],size:32,pop:t>c10&&t<c12-.1?seg(t,c10,c10+.3):0,tx:1480,ty:585});
    bubble(c,'',1700,500,{lines:['對，而且','腳下有地板。'],size:32,pop:t>c12?seg(t,c12,c12+.3):0,tx:1730,ty:585});
  }

  /* ---------- S04 報告登場 ---------- */
  function s04(c,t,s,q){
    room(c);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(0,0,W,H);
    const TW=250,TH=312,gap=34,x0=(W-(6*TW+5*gap))/2,y0=440;
    // 筆電（開蓋後卡片由螢幕飛出）
    const open=eO(seg(t,.2,.9));
    if(t<2.6){c.save();c.globalAlpha=1-seg(t,2.0,2.6);const lx=W/2,ly=830;
      c.fillStyle='#cfd5e2';c.beginPath();c.moveTo(lx-230,ly);c.lineTo(lx+230,ly);c.lineTo(lx+280,ly+40);c.lineTo(lx-280,ly+40);c.closePath();c.fill();c.strokeStyle=C.ink;c.lineWidth=6;c.stroke();
      c.save();c.translate(lx,ly);c.scale(1,open);box(c,-200,-170,400,170,16,C.ink);box(c,-182,-152,364,134,8,C.blueL);c.restore();c.restore();}
    const names=['首頁','經營概覽','公司量本利分析','公司保本與利潤模擬','單品貢獻與保本模擬','口徑說明'];
    const cc=q('公司層問'),cs=q('單品層問');
    const groupA=t>=cc-.2&&t<cs-.2,groupB=t>=cs-.2;
    for(let i=0;i<6;i++){
      const st=.9+i*.16,k=eOB(seg(t,st,st+.7)),fly=eO(seg(t,st,st+.9));
      const tx=x0+i*(TW+gap),ty=y0;
      const sx=W/2-TW*.2,sy=800;
      const x=lerp(sx,tx,fly),y=lerp(sy,ty,fly)-Math.sin(fly*Math.PI)*120,sc=lerp(.25,1,k);
      const inA=i>=1&&i<=3,inB=i===4;
      const hot=(groupA&&inA)||(groupB&&inB);const dim=(groupA||groupB)&&!hot;
      c.save();c.globalAlpha=clamp(fly*3)*(dim?.45:1);c.translate(x+TW/2,y+TH/2+(hot?-Math.sin(t*5)*5:0));c.scale(sc,sc);c.translate(-TW/2,-TH/2);
      box(c,-8,-8,TW+16,TH+16,18,hot?C.orange:C.white,C.ink,5);
      c.save();rr(c,0,0,TW,TH,10);c.clip();c.drawImage(IMG[i],0,0,TW,TH);c.restore();
      c.restore();
      if(fly>.9)text(c,names[i],tx+TW/2,ty+TH+46,{size:23,color:dim?C.grey:C.navy,alpha:clamp((fly-.9)*10)});
    }
    // 兩層橫幅（寬度避開彼此）
    const A=eOB(seg(t,cc-.2,cc+.3)),B=eOB(seg(t,cs-.2,cs+.3));
    if(A>0){c.save();c.translate(x0+(TW+gap)*2+TW/2,250);c.scale(A,A);box(c,-320,-70,640,160,30,C.blue,C.ink,6);
      c.fillStyle=C.white;c.fillRect(-285,-34,44,92);c.fillRect(-237,-12,32,70);for(let r=0;r<4;r++){c.fillStyle=C.blue;c.fillRect(-278,-22+r*20,11,9);c.fillRect(-259,-22+r*20,11,9);}
      text(c,'公司層',30,-26,{size:48,color:C.white});text(c,'這個月要做多少才不虧？',30,38,{size:32,color:C.white});c.restore();}
    if(B>0){c.save();c.translate(x0+(TW+gap)*4+TW/2,250);c.scale(B,B);box(c,-220,-70,440,160,30,C.orange,C.ink,6);
      box(c,-200,-30,64,52,18,C.cream,C.ink,4);c.fillStyle=C.orangeL;c.fillRect(-194,-38,52,14);
      text(c,'單品層',44,-26,{size:48,color:C.white});text(c,'這個產品值不值得投入？',20,38,{size:30,color:C.white});c.restore();}
  }

  /* ---------- S05 經營概覽 ---------- */
  function s05(c,t,s,q){
    room(c);c.fillStyle='rgba(255,255,255,.4)';c.fillRect(0,0,W,H);
    tag(c,'第 1 頁 · 經營概覽',960,52,{size:34,bg:C.blue});
    const vx=160,vy=96,vw=1600,vh=700;
    const kA=[0,0,1200,525],kB=[20,340,730,319.4];
    const cB=q('折線圖有個小秘密');
    const m=eIO(seg(t,cB-.4,cB+.6));
    const k=kA.map((v,i)=>lerp(v,kB[i],m));
    screenFrame(c,vx,vy,vw,vh,{pad:18});
    crop(c,IMG[1],k[0],k[1],k[2],k[3],vx,vy,vw,vh,10);
    const sc=vw/k[2];
    const map=r=>[vx+(r[0]-k[0])*sc,vy+(r[1]-k[1])*sc,r[2]*sc,r[3]*sc];
    // 固定費用構成圖：分塊數字與中心不一致 → 遮蔽並標示待確認（動畫不引用各塊金額）
    {const m2=map([748,355,425,240]);c.save();rr(c,vx,vy,vw,vh,10);c.clip();rr(c,m2[0],m2[1],m2[2],m2[3],12);c.fillStyle='#dfe5f2';c.fill();c.save();rr(c,m2[0],m2[1],m2[2],m2[3],12);c.clip();c.strokeStyle='#cbd4e8';c.lineWidth=18;for(let i=-20;i<40;i++){c.beginPath();c.moveTo(m2[0]+i*40,m2[1]+m2[3]);c.lineTo(m2[0]+i*40+m2[3],m2[1]);c.stroke();}c.restore();
      text(c,'固定費用構成圖',m2[0]+m2[2]/2,m2[1]+m2[3]/2-24,{size:Math.max(14,30*sc/1.4),color:C.grey});text(c,'（分塊數字待確認）',m2[0]+m2[2]/2,m2[1]+m2[3]/2+24,{size:Math.max(12,26*sc/1.4),color:C.grey});c.restore();}
    const spots=[[q('三十二個月'),q('收入四億')-.2,[30,105,280,78]],[q('收入四億'),q('利潤三千')-.2,[32,203,272,108]],[q('利潤三千'),q('安全邊際率')-.2,[608,203,275,108]],[q('安全邊際率'),cB-.5,[897,203,275,108]]];
    for(const [a,b,r] of spots){if(t>=a&&t<b){spot(c,map(r),Math.min(1,(t-a)*5)*(1-seg(t,b-.2,b)));}}
    // 小日曆（每年二月）
    const dips=[[100,497],[352,497],[597,497]],cF=q('每年二月');
    dips.forEach((d,i)=>{const st=cF+i*.55,kk=eOB(seg(t,st,st+.45));if(kk<=0||m<.5)return;
      const x=vx+(d[0]-k[0])*sc,y=vy+(d[1]-k[1])*sc-120;
      c.save();c.translate(x,y);c.scale(kk,kk);
      cloud(c,0,-92,1.1,'#7f8bab');
      box(c,-52,-44,104,110,14,C.white,C.red,5);c.fillStyle=C.red;c.fillRect(-52,-44,104,34);
      text(c,'2月',0,-27,{size:26,color:C.white});text(c,'2',0,20,{size:56,color:C.red});
      // 臉
      circ(c,-14,38,4,C.ink);circ(c,14,38,4,C.ink);c.strokeStyle=C.ink;c.lineWidth=3;c.beginPath();c.arc(0,56,8,Math.PI*1.15,Math.PI*1.85);c.stroke();
      c.restore();
      c.save();c.globalAlpha=kk;c.strokeStyle=C.red;c.lineWidth=4;c.setLineDash([6,7]);c.beginPath();c.moveTo(x,y+66);c.lineTo(x,vy+(d[1]-k[1])*sc-8);c.stroke();c.restore();});
    // 小琪：不亂猜
    const cG=q('原因報表沒說'),cN=q('我們不亂猜');
    if(t>cG-.2){const u=eO(seg(t,cG-.2,cG+.4));c.save();c.globalAlpha=u;person(c,{x:1730+(1-u)*140,y:910,s:.68,who:'qi',t,look:-1,handL:[-120,-60],handR:[-30,-160],mood:t>cN?'happy':'think',prop:'coffee'});c.restore();
      box(c,1500,870,420,40,0,'rgba(0,0,0,0)');}
    bubble(c,'',1500,610,{lines:['原因未知，','我們不亂猜'],size:34,pop:t>cN?seg(t,cN,cN+.3):0,tx:1700,ty:690});
    if(t>cG+1)tag(c,'原因未知，不下結論',1000,830,{size:30,bg:C.grey,alpha:seg(t,cG+.4,cG+1)*0+0});
  }

  /* ---------- S06 公司層：滑桿與槓桿 → 兩種頁面 ---------- */
  function s06(c,t,s,q){
    room(c);c.fillStyle='rgba(255,255,255,.4)';c.fillRect(0,0,W,H);
    const cB=q('同樣的分析');
    const A=1-seg(t,cB-.3,cB+.4), Bp=seg(t,cB-.1,cB+.6);
    // ---- 階段 A ----
    if(A>0){
      c.save();c.globalAlpha=A;c.translate(0,(1-A)*60);
      const f=screenFrame(c,110,110,1060,420,{pad:16});crop(c,IMG[2],0,90,1200,475,f.x,f.y,f.w,f.h,8);
      tag(c,'第 2 頁 · 公司量本利分析（原生）',640,64,{size:30,bg:C.blue});
      // 滑桿面板
      box(c,1250,110,560,420,30,C.cream,C.ink,6);text(c,'營收調整',1530,160,{size:42,color:C.navy});
      const tx0=1320,tx1=1740;box(c,tx0,300,tx1-tx0,16,8,C.greyL,C.ink,3);
      const drag=eIO(seg(t,q('他把營收往下拉'),q('他把營收往下拉')+2.1)), v=-10*drag;
      const kx=lerp(1530,1530-10/20*210,drag);
      box(c,tx0,300,Math.max(0,kx-tx0),16,8,C.blueL);
      [-20,0,20].forEach((n,i)=>text(c,(n>0?'+':'')+n+'%',1530+n/20*210,350,{size:24,color:C.grey,weight:600}));
      circ(c,kx,308,26,C.orange,C.ink,5);
      text(c,(v<0?'−':'')+Math.abs(Math.round(v))+'%',kx,244,{size:56,color:drag>.1?C.coral:C.ink});
      ptr(c,kx+14,330,1,drag>0&&drag<1?1:0);
      // 利潤卡
      box(c,1250,555,560,260,30,C.cream,C.ink,6);text(c,'預計經營利潤（萬元）',1530,600,{size:32,color:C.grey});
      const cp=q('利潤從六十二萬'),cd=q('掉到十八萬');
      const prof=Math.round(lerp(62,18,eIO(seg(t,cd,cd+1.3))));
      text(c,String(t<cd?62:prof),1530,700,{size:130,color:t<cd?C.green:C.coral,alpha:seg(t,.3,.7)});
      if(t>cd+1.2)tag(c,'約少 7 成',1530,782,{size:30,bg:C.coral,alpha:seg(t,cd+1.2,cd+1.6)});
      // 老周
      const cs=q('老闆瞪大眼睛'),cq=q('營收只少一成'),cl=q('這是經營槓桿');
      person(c,{x:320,y:880,s:.8,who:'zhou',t,look:.6,handL:[40,-100],handR:[-40,-100],mood:t>cs?'shock':'happy'});
      bubble(c,'',700,640,{lines:['營收只少一成，','利潤少了七成？'],size:40,pop:t>cq&&t<cl-.1?seg(t,cq,cq+.3):0,tx:420,ty:740});
      // 槓桿卡
      if(t>cl){const k=eOB(seg(t,cl,cl+.45));c.save();c.translate(850,690);c.scale(k,k);
        box(c,-350,-120,700,240,34,C.white,C.ink,6);text(c,'經營槓桿 7 倍',0,-62,{size:56,color:C.navy});
        box(c,-320,-10,230,70,20,C.blueL);text(c,'營收 −1%',-205,25,{size:34,color:C.navy});
        text(c,'▶',-48,25,{size:50,color:C.orange});
        const up=t>q('賺錢時是放大鏡'),dn=t>q('虧錢時也是');
        box(c,-10,-10,300,70,20,dn?'#f7c5bc':C.mintL);text(c,dn?'利潤 −7%':'利潤 ±7%',140,25,{size:34,color:dn?C.red:C.green});
        magnifier(c,300,10,42);
        c.restore();}
      c.restore();
    }
    // ---- 階段 B：原生 vs HTML ----
    if(Bp>0){
      c.save();c.globalAlpha=Bp;c.translate(0,(1-Bp)*60);
      const f1=screenFrame(c,90,130,860,560,{pad:16});crop(c,IMG[2],40,430,1120,729,f1.x,f1.y,f1.w,f1.h,8);
      const f2=screenFrame(c,980,130,860,560,{pad:16});crop(c,IMG[3],340,282,830,540,f2.x,f2.y,f2.w,f2.h,8);
      const c1=q('原生頁面透明'),c2=q('每個數字能逐項複核'),c3=q('HTML 頁面絲滑'),c4=q('拖著拖著');
      tag(c,'原生頁面',520,86,{size:34,bg:C.blue});tag(c,'HTML 頁面',1410,86,{size:34,bg:C.orange});
      if(t>c1)tag(c,'透明',520,760,{size:56,bg:C.blue,alpha:seg(t,c1,c1+.3),h:92});
      if(t>c3)tag(c,'絲滑',1410,760,{size:56,bg:C.orange,alpha:seg(t,c3,c3+.3),h:92});
      if(t>c2){ // 放大鏡掃過、逐項打勾
        const u=seg(t,c2,c2+2.2);magnifier(c,lerp(260,820,eIO(u)),lerp(330,560,Math.sin(u*Math.PI)*.6+.2),50);
        for(let i=0;i<4;i++){const st=c2+.3+i*.5,kk=eOB(seg(t,st,st+.3));if(kk>0){c.save();c.translate(260+i*180,640);c.scale(kk,kk);circ(c,0,0,26,C.green,C.ink,4);c.strokeStyle=C.white;c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(-11,0);c.lineTo(-3,9);c.lineTo(12,-9);c.stroke();c.restore();}}}
      if(t>c4){const u=((t-c4)*.8)%1,x=lerp(1060,1250,eIO(u<.5?u*2:2-u*2)),y=lerp(430,440,u);ptr(c,x,y,1,1);
        for(let i=0;i<3;i++){c.strokeStyle='rgba(242,140,56,.7)';c.lineWidth=6;c.lineCap='round';c.beginPath();c.moveTo(x-30-i*22,y+26+i*8);c.lineTo(x-80-i*22,y+26+i*8);c.stroke();}}
      c.restore();
    }
  }

  /* ---------- S07 單品層：旗艦君 ---------- */
  function s07(c,t,s,q){
    room(c);
    c.fillStyle='rgba(255,246,222,.55)';c.beginPath();c.ellipse(520,810,420,70,0,0,Math.PI*2);c.fill();
    const c1=q('是電飯煲旗艦款'),c3=q('一臺賣'),c4=q('貢獻一百一十九'),c5=q('計畫賣'),c6=q('邊際貢獻三十五'),c7=q('扣掉專屬'),c8=q('可追溯貢獻二十九'),c9=q('賣到四百八十六'),c10=q('就養得起'),c11=q('廠房租金'),c12=q('報告不分給他'),c13=q('所以看的是'),c14=q('不是產品利潤'),c16=q('這樣比較公平');
    // 旗艦君入場與小跳
    const enter=eO(seg(t,.2,1.2)),hopA=t<1.4?Math.abs(Math.sin(seg(t,.2,1.4)*Math.PI*2))*60:0;
    let mood='proud';if(t>c12&&t<c13)mood='refuse';if(t>c16)mood='happy';
    const flex=t>c10&&t<c10+2.2;
    cooker(c,{x:lerp(-260,520,enter),y:800,s:1.32,t,hop:hopA+(t>c4&&t<c4+.4?Math.sin(seg(t,c4,c4+.4)*Math.PI)*40:0)+(flex?Math.abs(Math.sin((t-c10)*5))*30:0),mood,
      handL:flex?[-150,-380]:(mood==='refuse'?[-110,-200]:[-125,-120]),handR:flex?[150,-380]:(mood==='refuse'?[190,-300]:[125,-120]),wink:t>c16?1:0});
    if(t>c1)tag(c,'電飯煲旗艦款',520,110,{size:40,bg:C.navy,alpha:seg(t,c1,c1+.3)*(1-seg(t,c3-.1,c3+.2)*.0)});
    // 價格牌
    if(t>c3){const k=eOB(seg(t,c3,c3+.5));c.save();c.translate(520,215);c.rotate(Math.sin(t*3)*.05);c.scale(k,k);
      c.strokeStyle=C.ink;c.lineWidth=4;c.beginPath();c.moveTo(-30,-70);c.lineTo(0,-8);c.lineTo(30,-70);c.stroke();
      box(c,-170,-10,340,86,18,C.gold,C.ink,5);text(c,'386.71 元／臺',0,34,{size:44,color:C.ink});c.restore();}
    // 硬幣
    if(t>c4){const u=seg(t,c4,c4+.7),y=lerp(300,700,eIO(u))-Math.sin(u*Math.PI)*0,bounce=u>.99?Math.abs(Math.sin((t-c4-.7)*6))*22*Math.exp(-(t-c4-.7)*2):0;
      c.save();c.translate(915,y-bounce);circ(c,0,0,64,C.gold,C.ink,6);circ(c,0,0,46,null,'#c9972c',4);text(c,'$',0,3,{size:60,color:'#b07a14'});c.restore();
      tag(c,'每臺貢獻 119.02 元',915,590,{size:30,bg:C.mint,alpha:seg(t,c4+.6,c4+1)});}
    // 右側：金額卡（35 萬 → 扣掉專屬固定費 6 萬 → 剩 29 萬）
    const cardA=eOB(seg(t,c6-.2,c6+.4));
    if(cardA>0){c.save();c.translate(1460,260);c.scale(cardA,cardA);box(c,-390,-150,780,300,30,C.cream,C.ink,6);
      text(c,'邊際貢獻 35 萬元',0,-100,{size:40,color:C.navy});
      const bw=640,bx=-320,by=-30,cw=bw*6/35,slide=eIO(seg(t,c7,c7+1.0));
      const mintW=t>=c7?bw-cw:bw;
      box(c,bx,by,mintW,70,18,C.mint,C.ink,5);
      text(c,t>=c7?'29':'35',bx+mintW/2,by+37,{size:40,color:C.white});
      if(t>=c7){c.save();c.globalAlpha=1-slide;c.translate(slide*70,-slide*40);box(c,bx+bw-cw,by,cw,70,14,C.orange,C.ink,5);text(c,'6',bx+bw-cw/2,by+37,{size:36,color:C.white});c.restore();
        tag(c,'專屬固定費 6 萬',240,92,{size:26,bg:C.orange,alpha:seg(t,c7,c7+.4)});}
      if(t>c8){const glow=t>c13&&t<c14+1.4;tag(c,'可追溯貢獻 29 萬元',-110,by+122,{size:36,bg:glow?C.orange:C.green,alpha:seg(t,c8,c8+.3)});}
      c.restore();}
    // 右側：銷量軌道
    const cardB=eOB(seg(t,c5-.2,c5+.4));
    if(cardB>0){c.save();c.translate(1460,640);c.scale(cardB,cardB);box(c,-390,-110,780,250,30,C.cream,C.ink,6);
      text(c,'計畫銷量',60,-62,{size:34,color:C.grey});
      const cnt=Math.round(2945*eIO(seg(t,c5,c5+2.2)));text(c,cnt.toLocaleString()+' 臺',270,-62,{size:56,color:C.navy,align:'center'});
      const bx=-340,bw=680;box(c,bx,20,bw,48,24,C.greyL,C.ink,4);box(c,bx,20,Math.max(8,bw*cnt/2945),48,24,C.blue);
      if(t>c9){const g=eO(seg(t,c9,c9+.6));flag(c,{x:bx+bw*486/2945,y:20,h:100,txt:'保本 486 臺',color:C.coral,t,grow:g,size:26});}
      if(t>c10)tag(c,'✓ 養得起專屬費用',130,118,{size:30,bg:C.green,alpha:seg(t,c10,c10+.3)});
      c.restore();}
    // 廠房帳單
    if(t>c11-.2&&t<c14+1.6){const u=eO(seg(t,c11-.2,c11+.8)),back=eIO(seg(t,c13,c13+1.2));
      const bx=lerp(1700,830,u)-back*1200,by=lerp(-120,470,u)-back*300;c.save();c.translate(bx,by);c.rotate(.12+Math.sin(t*4)*.03*(1-back));
      box(c,-180,-120,360,240,16,C.white,C.ink,5);c.fillStyle=C.coral;c.fillRect(-180,-120,360,50);text(c,'共同固定費用',0,-95,{size:32,color:C.white});
      c.fillStyle=C.grey;for(let i=0;i<3;i++)c.fillRect(-140,-40+i*38,280,12);
      // 廠房
      c.fillStyle='#cfd5e2';c.fillRect(-60,50,120,50);c.fillRect(-60,36,30,16);c.fillRect(0,36,30,16);
      text(c,'廠房租金…',0,-0,{size:30,color:C.ink});c.restore();}
    bubble(c,'房租，我不扛。',810,170,{size:46,pop:t>c12&&t<c13?seg(t,c12,c12+.3):0,tx:650,ty:300});
    bubble(c,'這樣比較公平。',830,120,{size:46,pop:t>c16?seg(t,c16,c16+.3):0,tx:620,ty:250});
    // 蓋章
    if(t>c14){const k=eOB(seg(t,c14,c14+.3));c.save();c.translate(1330,480);c.rotate(-.16);c.scale(k,k);
      box(c,-310,-56,620,112,18,'rgba(255,255,255,.92)',C.red,8);text(c,'≠ 產品利潤',0,2,{size:70,color:C.red});c.restore();}
  }

  /* ---------- S08 口徑與模型 ---------- */
  function s08(c,t,s,q){
    room(c);c.fillStyle='rgba(255,255,255,.4)';c.fillRect(0,0,W,H);
    const cM=q('背後的模型很小');
    const A=1-seg(t,cM-.3,cM+.3);
    if(A>0){c.save();c.globalAlpha=A;
      tag(c,'口徑說明頁',960,60,{size:34,bg:C.blue});
      const f=screenFrame(c,260,110,1400,640,{pad:18});crop(c,IMG[5],30,1050,1140,498,f.x,f.y,f.w,f.h,8);
      // 公式蓋章
      const ys=[1153,1182,1210,1237,1266];
      for(let i=0;i<4;i++){const st=.5+i*.55,kk=eOB(seg(t,st,st+.35));if(kk<=0)continue;const px=f.x+(550-30)*f.w/1140+20,py=f.y+(ys[i]-1050)*f.h/498;
        c.save();c.translate(px,py);c.rotate(-.2);c.scale(kk,kk);circ(c,0,0,26,'rgba(63,116,216,.9)',C.ink,4);c.strokeStyle=C.white;c.lineWidth=6;c.lineCap='round';c.beginPath();c.moveTo(-10,0);c.lineTo(-3,8);c.lineTo(11,-8);c.stroke();c.restore();}
      c.restore();}
    // ---- 模型圖 ----
    const B=seg(t,cM-.1,cM+.6);
    if(B>0){
      c.save();c.globalAlpha=B;
      const cL=q('三本流水帳'),cD=q('四本字典'),cLine=q('七條連線'),cFx=q('固定費用只連到日期'),cK=q('再加六十八個');
      const D=[['產品','12 款',360],['渠道','3 個',760],['區域','6 個',1160],['日期','1,096 天',1560]];
      const F=[['專屬固定費用','768 列',560],['銷售與變動成本','6,912 列',1000],['固定費用','128 列',1440]];
      const E=[[1,0],[1,1],[1,2],[1,3],[0,0],[0,3],[2,3]];
      const lineOn=eIO(seg(t,cLine,cLine+1.2));
      E.forEach(([f,d],i)=>{const fx=F[f][2],dx=D[d][2];const hot=f===2&&t>cFx&&t<cFx+4.8;const y1=520,y2=270;
        c.strokeStyle=hot?C.orange:'#8fb0ee';c.lineWidth=hot?10:5;c.globalAlpha=B*(hot?1:(t>cFx&&t<cFx+4.8?.25:.9));
        c.beginPath();c.moveTo(fx,y1);c.bezierCurveTo(fx,(y1+y2)/2,dx,(y1+y2)/2,dx,y2);
        const L=700;c.setLineDash([L*lineOn,L*2]);c.stroke();c.setLineDash([]);c.globalAlpha=B;});
      D.forEach((d,i)=>{const st=cD+i*.18,k=eOB(seg(t,st,st+.4));if(k<=0)return;c.save();c.translate(d[2],210);c.scale(k,k);
        box(c,-110,-70,220,130,16,C.mintL,C.ink,5);c.fillStyle=C.mint;c.fillRect(-110,-70,26,130);text(c,d[0],10,-30,{size:40,color:C.ink});text(c,d[1],10,24,{size:30,color:C.navy});
        for(let l=0;l<3;l++){c.fillStyle='rgba(31,58,104,.25)';c.fillRect(-70,32+l*0,0,0);}c.restore();});
      F.forEach((f,i)=>{const st=cL+i*.35,k=eOB(seg(t,st,st+.4));if(k<=0)return;c.save();c.translate(f[2],600);c.scale(k,k);
        const hh=i===1?190:150;box(c,-150,-70,300,hh,16,C.orangeL,C.ink,5);c.fillStyle=C.orange;c.fillRect(-150,-70,26,hh);
        text(c,f[0],12,-24,{size:32,color:C.ink,maxW:250});text(c,f[1],12,28,{size:40,color:C.navy});
        for(let l=0;l<(i===1?4:2);l++){c.fillStyle='rgba(31,58,104,.2)';c.fillRect(-100,62+l*22,220,10);}
        c.restore();});
      if(t>cFx)tag(c,'只連到日期 → 不分攤到產品',1180,455,{size:30,bg:C.orange,alpha:seg(t,cFx+.8,cFx+1.2)*(1-seg(t,cK-.4,cK))});
      // 68 顆計算機按鈕
      if(t>cK-.1){const a=eOB(seg(t,cK-.1,cK+.5));c.save();c.translate(960,400);c.scale(a,a);box(c,-430,-110,860,220,24,C.white,C.ink,6);
        let n=0;for(let r=0;r<4;r++)for(let cc=0;cc<17;cc++){const idx=r*17+cc;const on=idx<Math.floor(68*seg(t,cK,cK+1.6));
          box(c,-396+cc*47,-82+r*44,38,34,8,on?C.orange:C.greyL,C.ink,2);n++;}
        tag(c,'68 個度量值',0,0,{size:50,bg:C.orange,alpha:seg(t,cK+1.2,cK+1.7),h:86});c.restore();}
      c.restore();
    }
  }

  /* ---------- S09 回到會議室 ---------- */
  function s09(c,t,s,q){
    room(c,{sunset:1});
    const c1=q('老闆又問一次'),c2=q('我指著白板'),c3=q('一千二百一十七'),c5=q('一千四百一十八'),c6=q('是睡得著的距離'),c7=q('量本利，'),c9=q('拖累利潤的'),c12=q('老闆問'),c14=q('我說'),c17=q('已經到了');
    // 白板
    box(c,430,80,1100,520,26,C.white,C.ink,8);
    box(c,430,592,1100,26,8,'#b98a5a');
    // 旗子與距離
    const tx=v=>560+(v-800)/700*800; // 800–1500 萬放大顯示
    c.strokeStyle=C.grey;c.lineWidth=6;c.beginPath();c.moveTo(500,540);c.lineTo(1500,540);c.stroke();
    if(t>c3-.2)flag(c,{x:tx(1217),y:540,h:230,txt:'保本 1,217 萬',color:C.navy,t,grow:eO(seg(t,c3-.2,c3+.5)),size:32});
    if(t>c5)flag(c,{x:tx(1418),y:540,h:230,txt:'計畫 1,418 萬',color:C.blue,t,grow:eO(seg(t,c5,c5+.5)),size:32});
    if(t>c3)tag(c,'底線',tx(1217)+10,575,{size:26,bg:C.navy,alpha:seg(t,c3+.4,c3+.8)*(1-seg(t,c7-.3,c7))});
    if(t>c6-.5){const a=seg(t,c6-.5,c6+.2)*(1-seg(t,c7+.6,c7+1));c.save();c.globalAlpha=a;c.strokeStyle=C.orange;c.lineWidth=10;c.lineCap='round';c.beginPath();c.moveTo(tx(1217)+14,500);c.lineTo(tx(1418)-14,500);c.stroke();c.restore();
      tag(c,'睡得著的距離',(tx(1217)+tx(1418))/2,455,{size:34,bg:C.orange,alpha:a});
      text(c,'Z z z',tx(1418)+120,262+Math.sin(t*2)*8,{size:54,color:C.blue,alpha:a});}
    // 三大類
    if(t>c7){const labs=[['收入',C.blue],['成本結構',C.coral],['固定投入',C.mint]];
      labs.forEach((l,i)=>{const st=c7+.2+i*.3,k=eOB(seg(t,st,st+.4));if(k<=0)return;c.save();c.translate(690+i*250,170);c.scale(k,k);
        box(c,-105,-50,210,100,24,l[1],C.ink,5);text(c,l[0],0,2,{size:42,color:C.white});c.restore();});
      if(t>c9){const u=seg(t,c9,c9+3.2);magnifier(c,lerp(640,1150,eIO(u)),200+Math.sin(u*Math.PI)*24,46);}}
    // 人物
    const talk=t>c12&&t<c14;
    person(c,{x:260,y:760,s:1.0,who:'zhou',t,look:1,handL:[50,-130],handR:[-50,-130],mood:t>c14?'laugh':(t>c12?'happy':'think')});
    person(c,{x:1700,y:760,s:1.0,who:'qi',t,look:-1,handL:[-120,-70],handR:[-120,-290],prop:'marker',mood:'happy'});
    table(c,760);
    // 咖啡
    if(t>c14-.5){const k=eO(seg(t,c14-.5,c14+.3));c.save();c.translate(lerp(1500,430,0),0);c.restore();}
    bubble(c,'',470,180,{lines:['下個月，至少','要做多少？'],size:40,pop:t>c1&&t<c2?seg(t,c1,c1+.3):0,tx:320,ty:340});
    bubble(c,'',520,150,{lines:['那我現在，可以','回家吃飯了嗎？'],size:40,pop:t>c12&&t<c14?seg(t,c12,c12+.3):(t>=c14?1-seg(t,c14,c14+.2):0),tx:330,ty:330});
    bubble(c,'',1380,180,{lines:['可以，','利潤，已經到了。'],size:40,pop:t>c14?seg(t,c14,c14+.3):0,tx:1660,ty:340});
    // 利潤星星晚到
    if(t>c17-.2){const u=seg(t,c17-.2,c17+1.0);profitStar(c,{x:lerp(1000,900,u),y:lerp(900,650,eOB(u)),s:.7,t,wave:1,alpha:clamp(u*3)});}
    // 結尾字卡
    const e=s.durationFrames/30-2.3;
    if(t>e){const a=seg(t,e,e+.5);c.save();c.globalAlpha=a;c.fillStyle='rgba(31,58,104,.94)';c.fillRect(0,0,W,H);
      text(c,'賣多少，才不虧？',W/2,330,{size:104,color:C.white});
      ['資料為示範（模擬）資料','畫面取自公開發佈的 Power BI 報告（封面署名 @Ken.Liu）','人物與劇情為虛構，非原作者製作'].forEach((l,i)=>text(c,l,W/2,500+i*84,{size:44,color:i?'#dbe6ff':C.gold,weight:700}));
      c.restore();}
  }

  const SC={s01,s02,s03,s04,s05,s06,s07,s08,s09};
  window.prepareScenes=async t=>{
    await Promise.all([0,1,2,3,4,5].map(i=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>{IMG[i]=im;res();};im.onerror=()=>rej(Error('圖片載入失敗 page'+i));im.src=`assets/page${i}.jpg`;})));
    for(const s of t.scenes){if(!SC[s.id])throw Error(`未實作場景 ${s.id}`);mkcue(s)('');}
  };
  window.drawScene=(c,{scene:s,time,frame,localFrame,progress})=>{
    c.save();
    // 緩慢推近：全片每幀由 progress 決定
    const k=1+.02*progress;c.translate(W/2,H/2);c.scale(k,k);c.translate(-W/2,-H/2);
    SC[s.id](c,time,s,mkcue(s));
    c.restore();
    wipe(c,s,localFrame);
  };
})();
