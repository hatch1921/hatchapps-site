const MW = (() => {

  const FRACS={0.125:'\u215b',0.25:'\u00bc',0.333:'\u2153',0.375:'\u215c',0.5:'\u00bd',0.625:'\u215d',0.667:'\u2154',0.75:'\u00be',0.875:'\u215e'};
  const GRAM={flour:120,water:237,_tsp:{yeast:3,salt:6,sugar:4.2},_tbsp:{sugar:12.5}};
  const LIQUID=new Set(['water']);
  const TYPES={flour:'FLOUR',water:'LIQUID',yeast:'LEAVENING',sugar:'SUGAR',salt:'NONE'};

  const INGS=[
    {id:'flour',amount:3.5, unit:'cups',name:'Bread flour'},
    {id:'water',amount:1.25,unit:'cups',name:'Warm water'},
    {id:'yeast',amount:2.25,unit:'tsp', name:'Active dry yeast'},
    {id:'sugar',amount:1,   unit:'tbsp',name:'Sugar'},
    {id:'salt', amount:1.5, unit:'tsp', name:'Sea salt'},
  ];

  function frac(v){const w=Math.floor(v),f=Math.round((v-w)*1000)/1000,fs=FRACS[f]||(f>0?String(f):'');return w===0?(fs||'0'):(fs?w+fs:String(w));}
  function roundU(v,u){if(u==='cups')return Math.round(v*4)/4;if(u==='tbsp')return Math.round(v*2)/2;if(u==='tsp')return Math.round(v*4)/4;return Math.round(v*100)/100;}
  function toG(a,u,id){if(u==='cups')return Math.round(a*(GRAM[id]||120));if(u==='tsp')return Math.round(a*(GRAM._tsp[id]||4));if(u==='tbsp')return Math.round(a*(GRAM._tbsp[id]||14));return Math.round(a);}
  function gUnit(u,id){return(u==='cups'&&LIQUID.has(id))?'ml':'g';}

  function calcAdj(ing){
    const t=TYPES[ing.id];
    let adj=ing.amount,delta=0;
    if(t==='LEAVENING'){adj=Math.max(ing.amount*0.65,ing.amount*0.25);delta=adj-ing.amount;}
    if(t==='LIQUID'){const ex=ing.amount*0.125;adj=ing.amount+ex;delta=ex;}
    if(t==='LIQUID'){adj+=0.125;delta+=0.125;}
    return{...ing,adj,delta};
  }

  const ADJ=INGS.map(calcAdj);

  function dispAmt(ing,mode){
    if(mode==='grams')return toG(ing.adj,ing.unit,ing.id)+gUnit(ing.unit,ing.id);
    return frac(roundU(ing.adj,ing.unit))+' '+ing.unit;
  }
  function dispOrig(ing,mode){
    if(Math.abs(ing.delta)<0.005)return null;
    const a=dispAmt(ing,mode);
    const o=mode==='grams'?toG(ing.amount,ing.unit,ing.id)+gUnit(ing.unit,ing.id):frac(roundU(ing.amount,ing.unit))+' '+ing.unit;
    if(a===o)return null;
    return(ing.delta>0?'\u25b2':'\u25bc')+' was '+o;
  }

  let fUnit='cups',pUnit='cups',fShown=false,pShown=false;

  function renderFree(mode){
    const list=document.getElementById('free-ing-list');
    if(!list)return;
    list.innerHTML='';
    ADJ.forEach(ing=>{
      const orig=dispOrig(ing,mode);
      const dir=ing.delta>0.005?'up':ing.delta<-0.005?'dn':'no';
      list.innerHTML+='<li class="pb-mini-ing-row"><span class="pb-mini-ing-name">'+ing.name+'</span><span class="pb-mini-ing-amt">'+dispAmt(ing,mode)+'</span><span class="pb-mini-ing-orig '+dir+'">'+(orig||'')+'</span></li>';
    });
    const ts=mode==='grams'?'+8\u00b0C':'+15\u00b0F';
    const cards=document.getElementById('free-bake-cards');
    if(cards)cards.innerHTML=
      '<div class="pb-mini-bake-card">\ud83d\udd25 Oven <span class="pb-mini-bake-val">'+ts+'</span></div>'+
      '<div class="pb-mini-bake-card">\u23f1 Bake <span class="pb-mini-bake-val">-6 min</span></div>'+
      '<div class="pb-mini-bake-card">\ud83c\udf21 Proof <span class="pb-mini-bake-val">-15 min</span></div>';
    const fc=document.getElementById('f-cups'),fg=document.getElementById('f-grams');
    if(fc)fc.classList.toggle('on',mode==='cups');
    if(fg)fg.classList.toggle('on',mode==='grams');
  }

  function renderPro(mode){
    const list=document.getElementById('pro-ing-list');
    if(!list)return;
    list.innerHTML='';
    ADJ.forEach((ing,i)=>{
      const amt=pShown?dispAmt(ing,mode):(mode==='grams'?toG(ing.amount,ing.unit,ing.id)+gUnit(ing.unit,ing.id):frac(roundU(ing.amount,ing.unit))+' '+ing.unit);
      const orig=pShown?dispOrig(ing,mode):null;
      const dir=ing.delta>0.005?'up':ing.delta<-0.005?'dn':'';
      const delay=pShown?i*55:0;
      const origHTML=orig?'<span class="pro-mini-ing-orig '+dir+' '+(pShown?'show':'')+'" style="transition-delay:'+delay+'ms">'+orig+'</span>':'';
      list.innerHTML+='<li class="pro-mini-ing-row"><span class="pro-mini-ing-amt">'+amt+'</span><span class="pro-mini-ing-name">'+ing.name+'</span>'+origHTML+'</li>';
    });
    const ts=mode==='grams'?'+8\u00b0C':'+15\u00b0F';
    const bl=document.getElementById('pro-bake-line');
    if(bl){
      if(pShown){bl.innerHTML='Bake <span class="pb-pro-mini-bake-val">-6 min</span> &nbsp;\u00b7&nbsp; Proof <span class="pb-pro-mini-bake-val">-15 min</span> &nbsp;\u00b7&nbsp; Oven <span class="pb-pro-mini-bake-val">'+ts+'</span>';bl.classList.add('show');}
      else{bl.innerHTML='';bl.classList.remove('show');}
    }
    const status=document.getElementById('pro-status');
    if(status)status.classList.toggle('show',pShown);
    const btn=document.getElementById('pro-adjust-btn');
    if(btn)btn.style.display=pShown?'none':'';
    const tempStr=mode==='grams'?'196\u00b0C':'390\u00b0F';
    const el=function(id){return document.getElementById(id);};
    if(pShown){
      if(el('pro-temp'))el('pro-temp').textContent=tempStr;
      if(el('pro-bake'))el('pro-bake').textContent='26 minutes';
      if(el('pro-proof'))el('pro-proof').textContent='75 minutes';
    }else{
      if(el('pro-temp'))el('pro-temp').textContent='375\u00b0F';
      if(el('pro-bake'))el('pro-bake').textContent='32 minutes';
      if(el('pro-proof'))el('pro-proof').textContent='90 minutes';
    }
    const pc=document.getElementById('p-cups'),pg=document.getElementById('p-grams');
    if(pc)pc.classList.toggle('on',mode==='cups');
    if(pg)pg.classList.toggle('on',mode==='grams');
  }

  function adjustFree(){
    fShown=true;
    renderFree(fUnit);
    const bar=document.getElementById('pb-mini-bar');
    const res=document.getElementById('pb-mini-results');
    if(!bar||!res)return;
    bar.style.opacity='0';
    bar.style.transform='translateY(-4px)';
    setTimeout(function(){
      bar.style.display='none';
      res.style.display='block';
      res.style.opacity='0';
      res.style.transform='translateY(-6px)';
      setTimeout(function(){res.style.opacity='1';res.style.transform='translateY(0)';},20);
    },180);
  }

  function resetFree(){
    fShown=false;fUnit='cups';
    const bar=document.getElementById('pb-mini-bar');
    const res=document.getElementById('pb-mini-results');
    if(!res||!bar)return;
    res.style.opacity='0';
    res.style.transform='translateY(-4px)';
    setTimeout(function(){
      res.style.display='none';
      bar.style.display='flex';
      bar.style.opacity='0';
      bar.style.transform='translateY(-4px)';
      setTimeout(function(){bar.style.opacity='1';bar.style.transform='translateY(0)';},20);
    },180);
  }

  function setFreeUnit(mode){
    fUnit=mode;
    if(fShown)renderFree(mode);
    else{
      const fc=document.getElementById('f-cups'),fg=document.getElementById('f-grams');
      if(fc)fc.classList.toggle('on',mode==='cups');
      if(fg)fg.classList.toggle('on',mode==='grams');
    }
  }

  function adjustPro(){pShown=true;renderPro(pUnit);}
  function resetPro(){pShown=false;pUnit='cups';renderPro('cups');}
  function setProUnit(mode){pUnit=mode;renderPro(mode);}

  document.addEventListener('DOMContentLoaded',function(){renderPro('cups');});

  return{adjustFree:adjustFree,resetFree:resetFree,setFreeUnit:setFreeUnit,adjustPro:adjustPro,resetPro:resetPro,setProUnit:setProUnit};
})();

const nav=document.getElementById('nav');
window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',window.scrollY>20);},{passive:true});
