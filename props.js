/* 共用繪圖：緩動、文字、氣泡、人物（小琪／老周）、旗艦君、利潤星星、桶子、旗子等。
   每個函式都是「參數 → 畫面」的純函式，不保存狀態；動作全由 t（秒）決定。 */
(() => {
  const FONT = "'Microsoft JhengHei','Noto Sans TC','PingFang TC',Arial,sans-serif";
  const C = {
    paper:'#f8f1e4', wall:'#f1e4cd', wall2:'#e9d6b8', floor:'#cfae85', wood:'#b98a5a', woodD:'#9c7046',
    ink:'#243049', navy:'#1f3a68', blue:'#3f74d8', blueL:'#a9c4f5', orange:'#f28c38', orangeL:'#ffd0a1',
    mint:'#35b49a', mintL:'#bfe8dc', coral:'#ea6a57', gold:'#f5c04f', cream:'#fff8ea', white:'#ffffff',
    skin:'#f2c9a5', skin2:'#e4ad86', grey:'#9aa5b8', greyL:'#e4e8ef', green:'#1f9a6a', red:'#e0584a'
  };
  const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const seg=(t,a,b)=>clamp((t-a)/(b-a));
  const eIO=t=>{t=clamp(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
  const eO=t=>1-Math.pow(1-clamp(t),3);
  const eOB=t=>{t=clamp(t);const c=1.7;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
  const hash=n=>{const v=Math.sin(n*127.1+37.7)*43758.5453;return v-Math.floor(v);};

  function rr(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
  function box(c,x,y,w,h,r,fill,stroke,lw=4){rr(c,x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
  function circ(c,x,y,r,fill,stroke,lw=4){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
  function text(c,s,x,y,o={}){
    const {size=40,color=C.ink,weight=800,align='center',base='middle',font=FONT,alpha=1,maxW}=o;
    c.save();c.globalAlpha*=alpha;c.font=`${weight} ${size}px ${font}`;c.textAlign=align;c.textBaseline=base;c.fillStyle=color;
    if(maxW)c.fillText(s,x,y,maxW);else c.fillText(s,x,y);c.restore();
  }
  // 圓角標籤（含文字）
  function tag(c,s,x,y,o={}){
    const {size=34,color=C.white,bg=C.orange,padX=22,h=size*1.55,align='center',alpha=1,r}=o;
    c.save();c.font=`800 ${size}px ${FONT}`;const w=c.measureText(s).width+padX*2;c.restore();
    const left=align==='center'?x-w/2:(align==='left'?x:x-w);
    c.save();c.globalAlpha*=alpha;box(c,left,y-h/2,w,h,r??h/2,bg);text(c,s,left+w/2,y+size*.03,{size,color});c.restore();return w;
  }
  // 對話氣泡：pop 0..1 為彈出進度；(tx,ty) 是尖角指向
  function bubble(c,s,x,y,o={}){
    const {size=40,pop=1,tx=x,ty=y+120,w,fill=C.white,stroke=C.ink,color=C.ink,lines}=o;
    if(pop<=0)return;
    c.save();c.font=`800 ${size}px ${FONT}`;
    const ls=lines||[s];const tw=Math.max(...ls.map(l=>c.measureText(l).width));c.restore();
    const bw=w||tw+60,bh=ls.length*size*1.35+36;
    const k=eOB(pop);c.save();c.translate(x,y);c.scale(k,k);c.globalAlpha*=clamp(pop*3);
    // 尖角
    const ax=clamp(tx-x,-bw/2+40,bw/2-40);
    c.beginPath();c.moveTo(ax-18,bh/2-2);c.lineTo(tx-x,ty-y);c.lineTo(ax+18,bh/2-2);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=5;c.lineJoin='round';c.stroke();
    box(c,-bw/2,-bh/2,bw,bh,28,fill,stroke,5);
    c.beginPath();c.moveTo(ax-14,bh/2-1);c.lineTo(ax+14,bh/2-1);c.strokeStyle=fill;c.lineWidth=8;c.stroke();
    ls.forEach((l,i)=>text(c,l,0,-bh/2+18+size*.675+i*size*1.35,{size,color}));
    c.restore();
  }
  // 兩段式反向運動學：由肩 S 到手 H，肘向 bend 方向彎
  function ik(S,H,l1,l2,bend){
    let dx=H.x-S.x,dy=H.y-S.y,d=Math.hypot(dx,dy);const max=l1+l2-1;
    if(d>max){dx*=max/d;dy*=max/d;d=max;}
    const a=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1)),base=Math.atan2(dy,dx);
    const ang=base+bend*a;return {x:S.x+Math.cos(ang)*l1,y:S.y+Math.sin(ang)*l1,hx:S.x+dx,hy:S.y+dy};
  }
  function limb(c,S,E,Hd,w,col){c.lineCap='round';c.lineJoin='round';c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(S.x,S.y);c.lineTo(E.x,E.y);c.lineTo(Hd.x,Hd.y);c.stroke();}

  /* 人物（半身，下緣被桌子或畫面切掉）。o: x,y(腰線),s,who:'qi'|'zhou',mood,t,look,handL,handR(相對於 x,y 的目標 [dx,dy]),prop */
  function person(c,o){
    const {x,y,s=1,who='qi',mood='calm',t=0,look=0,handL=[-150,-60],handR=[150,-60],prop=null,alpha=1}=o;
    const qi=who==='qi';
    const shirt=qi?C.mint:C.navy, skin=qi?C.skin:C.skin2;
    c.save();c.globalAlpha*=alpha;c.translate(x,y);c.scale(s,s);
    const breathe=Math.sin(t*2.2+(qi?0:1.7))*3;
    // 手臂（先畫後臂，再軀幹，再前臂以免穿幫）
    const SL={x:-96,y:-228+breathe},SR={x:96,y:-228+breathe};
    const eL=ik(SL,{x:handL[0],y:handL[1]},120,120,-1),eR=ik(SR,{x:handR[0],y:handR[1]},120,120,1);
    limb(c,SL,eL,{x:eL.hx,y:eL.hy},50,shirt);limb(c,SR,eR,{x:eR.hx,y:eR.hy},50,shirt);
    // 軀幹
    box(c,-118,-262+breathe,236,300,84,shirt);
    if(qi){ // 白襯衫領口
      c.beginPath();c.moveTo(-40,-262+breathe);c.lineTo(0,-205+breathe);c.lineTo(40,-262+breathe);c.closePath();c.fillStyle=C.white;c.fill();
    }else{ // 領帶
      c.beginPath();c.moveTo(-34,-262+breathe);c.lineTo(34,-262+breathe);c.lineTo(0,-210+breathe);c.closePath();c.fillStyle=C.white;c.fill();
      c.beginPath();c.moveTo(-14,-218+breathe);c.lineTo(14,-218+breathe);c.lineTo(22,-110+breathe);c.lineTo(0,-84+breathe);c.lineTo(-22,-110+breathe);c.closePath();c.fillStyle=C.coral;c.fill();
    }
    // 頸與頭
    const hy=-336+breathe;
    box(c,-24,-290+breathe,48,50,18,skin);
    // 後髮（小琪髮髻）
    if(qi){circ(c,6,hy-92,34,'#5a3a2a');}
    circ(c,0,hy,74,skin);
    // 髮型
    if(qi){
      c.beginPath();c.arc(0,hy,78,Math.PI*1.02,Math.PI*1.98);c.lineTo(62,hy-30);c.quadraticCurveTo(0,hy-50,-62,hy-30);c.closePath();c.fillStyle='#5a3a2a';c.fill();
    }else{
      c.beginPath();c.arc(0,hy,77,Math.PI*1.08,Math.PI*1.92);c.quadraticCurveTo(0,hy-40,-72,hy-18);c.closePath();c.fillStyle='#b9b4aa';c.fill();
      circ(c,-74,hy+6,14,'#b9b4aa');circ(c,74,hy+6,14,'#b9b4aa');
    }
    circ(c,-74,hy+8,15,skin);circ(c,74,hy+8,15,skin); // 耳
    // 眼睛
    const blink=(Math.sin(t*1.3+(qi?0:2))>.985)?.12:1;
    const ex=look*7,shock=mood==='shock'||mood==='worry';
    for(const d of [-1,1]){
      const px=d*28+ex,py=hy+4;
      if(mood==='laugh'||mood==='happy'&&Math.sin(t*3)>.95){c.strokeStyle=C.ink;c.lineWidth=6;c.lineCap='round';c.beginPath();c.arc(px,py+4,12,Math.PI*1.1,Math.PI*1.9);c.stroke();}
      else{circ(c,px,py,shock?15:11,C.white,C.ink,3);c.save();c.translate(px+look*4,py);c.scale(1,blink);circ(c,0,0,shock?7:6,C.ink);c.restore();}
    }
    if(!qi){ // 眼鏡
      for(const d of [-1,1])circ(c,d*28+ex,hy+4,22,null,C.ink,4);
      c.strokeStyle=C.ink;c.lineWidth=4;c.beginPath();c.moveTo(-6+ex,hy+2);c.lineTo(6+ex,hy+2);c.stroke();
    }
    // 眉
    c.strokeStyle=qi?'#5a3a2a':'#7b766d';c.lineWidth=7;c.lineCap='round';
    for(const d of [-1,1]){
      let a=0;if(mood==='worry')a=d*-.35;else if(mood==='shock')a=-.1;else if(mood==='happy'||mood==='laugh')a=.1;else if(mood==='think')a=d===1?-.3:.1;
      const bx=d*28+ex,by=hy-30-(mood==='shock'?10:0);
      c.beginPath();c.moveTo(bx-16,by+a*40);c.lineTo(bx+16,by-a*40);c.stroke();
    }
    // 嘴
    c.strokeStyle=C.ink;c.lineWidth=6;c.lineCap='round';c.fillStyle=C.ink;
    const my=hy+44;
    if(mood==='shock'){c.beginPath();c.ellipse(ex,my+4,14,18+Math.sin(t*10)*2,0,0,Math.PI*2);c.fill();}
    else if(mood==='laugh'){c.beginPath();c.arc(ex,my-6,26,.05,Math.PI-.05);c.closePath();c.fill();c.fillStyle='#e87a6e';c.beginPath();c.arc(ex,my+10,13,Math.PI,0);c.fill();}
    else if(mood==='happy'){c.beginPath();c.arc(ex,my-8,24,.15,Math.PI-.15);c.stroke();}
    else if(mood==='worry'){c.beginPath();c.arc(ex,my+16,22,Math.PI*1.15,Math.PI*1.85);c.stroke();}
    else if(mood==='think'){c.beginPath();c.moveTo(ex-14,my);c.lineTo(ex+16,my-5);c.stroke();}
    else{c.beginPath();c.arc(ex,my-6,18,.25,Math.PI-.25);c.stroke();}
    if(qi||mood==='laugh'){circ(c,-52+ex,hy+34,13,'rgba(240,130,110,.35)');circ(c,52+ex,hy+34,13,'rgba(240,130,110,.35)');}
    // 手（在袖口上）
    circ(c,eL.hx,eL.hy,25,skin);circ(c,eR.hx,eR.hy,25,skin);
    // 道具
    if(prop==='coffee'){const hx=eR.hx,hy2=eR.hy;box(c,hx-24,hy2-40,52,56,10,C.white,C.ink,4);c.strokeStyle=C.ink;c.lineWidth=5;c.beginPath();c.arc(hx+32,hy2-12,13,-1.4,1.4);c.stroke();
      c.strokeStyle='rgba(150,150,160,.7)';c.lineWidth=5;for(let i=0;i<2;i++){c.beginPath();for(let k=0;k<=20;k++){const yy=hy2-48-k*3.2,xx=hx-8+i*16+Math.sin(t*3+k*.4+i)*5;k?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();}}
    if(prop==='marker'){const hx=eR.hx,hy2=eR.hy;c.save();c.translate(hx,hy2);c.rotate(-.7);box(c,-8,-70,16,92,6,C.coral,C.ink,3);box(c,-8,-84,16,18,5,C.ink);c.restore();}
    c.restore();
  }
  // 手持物與手的世界座標（供外部在手上掛東西）
  function handPos(o,side='R'){const {x,y,s=1,handL=[-150,-60],handR=[150,-60]}=o;const h=side==='L'?handL:handR;return {x:x+h[0]*s,y:y+h[1]*s};}

  /* 旗艦君：電飯煲（圓肚、小手叉腰、有點自尊心） */
  function cooker(c,o){
    const {x,y,s=1,t=0,mood='proud',hop=0,handL=[-125,-120],handR=[125,-120],alpha=1,wink=0}=o;
    c.save();c.globalAlpha*=alpha;c.translate(x,y-hop);c.scale(s,s);
    // 影子（不隨跳起）
    c.save();c.translate(0,hop);c.scale(1-hop/700,1);c.fillStyle='rgba(60,40,20,.18)';c.beginPath();c.ellipse(0,0,150,20,0,0,Math.PI*2);c.fill();c.restore();
    // 腳
    for(const d of [-1,1]){box(c,d*62-26,-34,52,40,16,C.ink);}
    // 手臂
    const SL={x:-132,y:-196},SR={x:132,y:-196};
    const eL=ik(SL,{x:handL[0],y:handL[1]},70,70,-1),eR=ik(SR,{x:handR[0],y:handR[1]},70,70,1);
    c.lineCap='round';c.lineJoin='round';
    for(const [S,E] of [[SL,eL],[SR,eR]]){c.strokeStyle=C.ink;c.lineWidth=22;c.beginPath();c.moveTo(S.x,S.y);c.lineTo(E.x,E.y);c.lineTo(E.hx,E.hy);c.stroke();}
    circ(c,eL.hx,eL.hy,17,C.cream,C.ink,5);circ(c,eR.hx,eR.hy,17,C.cream,C.ink,5);
    // 身體
    box(c,-148,-290,296,264,92,C.cream,C.ink,7);
    box(c,-148,-120,296,54,0,C.orange);c.strokeStyle=C.ink;c.lineWidth=0;
    // 身體下緣切邊遮罩：用圓角再描一次
    rr(c,-148,-290,296,264,92);c.strokeStyle=C.ink;c.lineWidth=7;c.stroke();
    // 蓋子
    c.beginPath();c.ellipse(0,-298,126,66,0,Math.PI,Math.PI*2);c.lineTo(126,-290);c.lineTo(-126,-290);c.closePath();c.fillStyle=C.orangeL;c.fill();c.strokeStyle=C.ink;c.lineWidth=7;c.stroke();
    box(c,-26,-378,52,34,14,C.gold,C.ink,6);
    // 蒸氣孔與蒸氣
    c.strokeStyle='rgba(190,196,210,.9)';c.lineWidth=7;for(let i=0;i<2;i++){c.beginPath();for(let k=0;k<=16;k++){const yy=-392-k*4,xx=-8+i*16+Math.sin(t*3+k*.5+i*2)*7;k?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();}
    // 臉
    for(const d of [-1,1]){
      const w=(d===1&&wink>0)?wink:0;
      if(w>.5){c.strokeStyle=C.ink;c.lineWidth=6;c.lineCap='round';c.beginPath();c.arc(d*46,-205,12,Math.PI*1.1,Math.PI*1.9);c.stroke();}
      else{circ(c,d*46,-208,15,C.white,C.ink,4);circ(c,d*46+2,-206,7,C.ink);}
    }
    c.strokeStyle=C.ink;c.lineWidth=6;c.lineCap='round';
    if(mood==='proud'||mood==='happy'){c.beginPath();c.arc(0,-196,26,.2,Math.PI-.2);c.stroke();}
    else if(mood==='refuse'){c.beginPath();c.moveTo(-22,-176);c.lineTo(22,-176);c.stroke();for(const d of [-1,1]){c.beginPath();c.moveTo(d*34-12,-246);c.lineTo(d*34+12,-236+d*0);c.stroke();}}
    else{c.beginPath();c.arc(0,-190,18,.2,Math.PI-.2);c.stroke();}
    circ(c,-86,-176,15,'rgba(240,130,110,.4)');circ(c,86,-176,15,'rgba(240,130,110,.4)');
    // 銘牌
    box(c,-60,-106,120,40,10,C.gold,C.ink,4);text(c,'旗艦',0,-85,{size:28,color:C.ink});
    c.restore();
  }

  /* 利潤：戴領結的小星星 */
  function profitStar(c,o){
    const {x,y,s=1,t=0,rot=0,alpha=1,wave=0}=o;
    c.save();c.globalAlpha*=alpha;c.translate(x,y);c.scale(s,s);c.rotate(rot);
    const pts=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?44:92;pts.push([Math.cos(a)*r,Math.sin(a)*r]);}
    c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();
    c.fillStyle=C.gold;c.fill();c.strokeStyle=C.ink;c.lineWidth=6;c.lineJoin='round';c.stroke();
    for(const d of [-1,1]){circ(c,d*20,-6,9,C.ink);}
    c.strokeStyle=C.ink;c.lineWidth=5;c.lineCap='round';c.beginPath();c.arc(0,10,16,.2,Math.PI-.2);c.stroke();
    // 領結
    c.fillStyle=C.coral;c.strokeStyle=C.ink;c.lineWidth=4;
    c.beginPath();c.moveTo(0,40);c.lineTo(-30,26);c.lineTo(-30,54);c.closePath();c.fill();c.stroke();
    c.beginPath();c.moveTo(0,40);c.lineTo(30,26);c.lineTo(30,54);c.closePath();c.fill();c.stroke();circ(c,0,40,8,C.ink);
    // 小手揮動
    c.strokeStyle=C.ink;c.lineWidth=7;c.beginPath();c.moveTo(70,14);c.lineTo(104,-8+Math.sin(t*9)*14*wave);c.stroke();
    c.restore();
  }

  /* 桶子：梯形，fill 0..1 為水位 */
  function bucket(c,o){
    const {x,y,w,h,fills=[],label='',labelColor=C.ink,labelSize=34}=o; // fills: [{f,color}] 由下往上累加
    const top=w,bot=w*.82;
    const path=()=>{c.beginPath();c.moveTo(x-top/2,y);c.lineTo(x+top/2,y);c.lineTo(x+bot/2,y+h);c.lineTo(x-bot/2,y+h);c.closePath();};
    c.save();path();c.fillStyle='rgba(255,255,255,.65)';c.fill();c.clip();
    let acc=0;
    for(const f of fills){if(f.f<=0)continue;const y1=y+h-h*acc,y0=y+h-h*(acc+f.f);c.fillStyle=f.color;c.fillRect(x-w,y0,w*2,y1-y0+1);
      c.fillStyle='rgba(255,255,255,.28)';c.fillRect(x-w,y0,w*2,6);acc+=f.f;}
    c.restore();
    path();c.strokeStyle=C.ink;c.lineWidth=7;c.lineJoin='round';c.stroke();
    c.strokeStyle=C.ink;c.lineWidth=7;c.beginPath();c.moveTo(x-top/2-14,y);c.lineTo(x+top/2+14,y);c.stroke();
    if(label)text(c,label,x,y+h+50,{size:labelSize,color:labelColor});
  }
  function flag(c,o){
    const {x,y,h,txt='',color=C.coral,t=0,grow=1,size=30}=o; // y = 旗桿底
    const hh=h*grow;
    c.strokeStyle=C.ink;c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x,y-hh);c.stroke();
    if(grow<.6)return;
    c.save();c.font=`800 ${size}px ${FONT}`;const w=c.measureText(txt).width+44;c.restore();
    const wave=Math.sin(t*5)*5;
    c.beginPath();c.moveTo(x,y-hh);c.lineTo(x+w,y-hh+wave);c.lineTo(x+w-14,y-hh+size*.9+wave*.5);c.lineTo(x+w,y-hh+size*1.8);c.lineTo(x,y-hh+size*1.8);c.closePath();
    c.fillStyle=color;c.fill();c.strokeStyle=C.ink;c.lineWidth=5;c.lineJoin='round';c.stroke();
    text(c,txt,x+w/2-4,y-hh+size*.9,{size,color:C.white});
  }
  function cloud(c,x,y,s=1,col='#8f9bb3'){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=col;c.beginPath();c.arc(-22,6,18,0,Math.PI*2);c.arc(0,-6,24,0,Math.PI*2);c.arc(24,4,18,0,Math.PI*2);c.rect(-22,6,46,18);c.fill();c.restore();}
  // 螢幕外框（讓報告截圖像放在筆電螢幕上）：回傳內部矩形
  function screenFrame(c,x,y,w,h,o={}){
    const {pad=18,col=C.ink,alpha=1}=o;
    c.save();c.globalAlpha*=alpha;box(c,x-pad,y-pad,w+pad*2,h+pad*2,26,col);box(c,x,y,w,h,12,C.white);c.restore();
    return {x,y,w,h};
  }
  // 圖像裁切：把 page 影像的 (sx,sy,sw,sh)（頁面座標 1200×1500）貼進矩形
  function crop(c,img,sx,sy,sw,sh,x,y,w,h,r=12){
    const k=img.naturalWidth/1200;c.save();rr(c,x,y,w,h,r);c.clip();c.drawImage(img,sx*k,sy*k,sw*k,sh*k,x,y,w,h);c.restore();
  }
  function ptr(c,x,y,s=1,press=0){ // 滑鼠游標
    c.save();c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(0,0);c.lineTo(0,52);c.lineTo(14,40);c.lineTo(26,64);c.lineTo(38,58);c.lineTo(26,35);c.lineTo(44,34);c.closePath();
    c.fillStyle=press?C.orange:C.white;c.fill();c.strokeStyle=C.ink;c.lineWidth=5;c.lineJoin='round';c.stroke();c.restore();
  }
  function magnifier(c,x,y,r,t=0){
    c.save();c.translate(x,y);c.strokeStyle=C.ink;c.lineWidth=14;c.lineCap='round';c.beginPath();c.moveTo(r*.72,r*.72);c.lineTo(r*1.6,r*1.6);c.stroke();
    circ(c,0,0,r,'rgba(190,225,255,.45)',C.ink,12);c.restore();
  }

  window.P={FONT,C,clamp,lerp,seg,eIO,eO,eOB,hash,rr,box,circ,text,tag,bubble,person,handPos,cooker,profitStar,bucket,flag,cloud,screenFrame,crop,ptr,magnifier,ik,limb};
})();
