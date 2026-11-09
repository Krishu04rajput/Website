import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const $ = (s) => document.querySelector(s);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = matchMedia("(max-width: 800px)").matches;

// Navigation
const toggle = $("#menuToggle"), menu = $("#menu");
toggle?.addEventListener("click", () => {
  const open = menu.classList.toggle("is-open");
  toggle.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});
menu?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  menu.classList.remove("is-open"); toggle?.classList.remove("is-open");
  toggle?.setAttribute("aria-expanded", "false");
}));

// Scroll progress and hero transformation
let scrollMix = 0;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const smooth = (a,b,x) => { const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
function onScroll(){
  const max = document.documentElement.scrollHeight - innerHeight;
  $("#progress").style.width = `${max ? scrollY/max*100 : 0}%`;
  const section = $("#heroScroll"), rect = section.getBoundingClientRect();
  scrollMix = clamp(-rect.top / Math.max(1, section.offsetHeight-innerHeight), 0, 1);
  $("#scrollMessage")?.classList.toggle("show", scrollMix>.34 && scrollMix<.9);
}
addEventListener("scroll", onScroll, {passive:true}); onScroll();

// Project gallery controls
const gallery = $("#workGallery"), cards = [...document.querySelectorAll(".project-card")];
function updateGalleryCount(){
  if(!gallery || !cards.length) return;
  const first = cards.reduce((best,card,i) => Math.abs(card.offsetLeft-gallery.scrollLeft) < Math.abs(cards[best].offsetLeft-gallery.scrollLeft) ? i : best,0);
  $("#galleryCount").textContent = `${String(first+1).padStart(2,"0")} — ${String(cards.length).padStart(2,"0")}`;
}
$("#galleryPrev")?.addEventListener("click",()=>gallery.scrollBy({left:-gallery.clientWidth*.78,behavior:reduced?"auto":"smooth"}));
$("#galleryNext")?.addEventListener("click",()=>gallery.scrollBy({left:gallery.clientWidth*.78,behavior:reduced?"auto":"smooth"}));
gallery?.addEventListener("scroll",updateGalleryCount,{passive:true}); updateGalleryCount();

// Reveal
if("IntersectionObserver" in window && !reduced){
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");observer.unobserve(e.target);}}),{threshold:.12});
  document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));
}else document.querySelectorAll(".reveal").forEach(el=>el.classList.add("visible"));
$("#year").textContent = new Date().getFullYear();

// Floating cliff particle field
const canvas=$("#cliffCanvas"), stage=$("#heroStage");
let renderer, scene, camera, island, rockGeometry, rockMaterial, basePositions, scatterPositions, pointer=new THREE.Vector2(5,5), targetX=0,targetY=0,rotX=0,rotY=0,drag=false,lastX=0,lastY=0,pulse=0,raf=0;
const rand=(a,b)=>a+Math.random()*(b-a);
function noise(x,z){return Math.sin(x*2.7+Math.sin(z*1.8)*1.4)*.28+Math.sin(z*4.4-x*1.3)*.16+Math.sin(x*8.1+z*5.2)*.055;}
function edge(a){return 2.55+.24*Math.sin(a*3+.7)+.18*Math.sin(a*7-1.1)+.09*Math.sin(a*13+2);}
function topHeight(x,z){const r=Math.hypot(x/2.8,z/1.78);return .55+noise(x,z)*.28-.13*r*r+.08*Math.sin(x*1.1-z*.7);}
function initCliff(){
  try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!mobile,powerPreference:"low-power"});
    renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.7));
    renderer.setSize(innerWidth,innerHeight);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(34,innerWidth/innerHeight,.1,100);camera.position.set(0,0,12);
    island=new THREE.Group();scene.add(island);
    const count=mobile?11000:26000;
    basePositions=new Float32Array(count*3);scatterPositions=new Float32Array(count*3);
    const cols=["#b9b3a8","#8e8b84","#696b68","#4b514f","#d1c5ae","#9d8c77","#59615e"].map(c=>new THREE.Color(c));
    const colors=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      let x,y,z,k=Math.random();
      if(k<.43){const a=rand(0,Math.PI*2),r=Math.sqrt(Math.random())*edge(a);x=Math.cos(a)*r;z=Math.sin(a)*r*.68;y=topHeight(x,z)+rand(-.025,.035);}
      else if(k<.92){const a=rand(0,Math.PI*2),t=rand(0,1),r=edge(a)*(1-.13*t)+noise(Math.cos(a)*3,Math.sin(a)*2)*.13;x=Math.cos(a)*r;z=Math.sin(a)*r*.68;y=topHeight(x,z)-t*(1.55+.18*Math.sin(a*8)+.12*Math.sin(a*15));const ledge=Math.sin(t*28+Math.sin(a*9))*.045;x+=Math.cos(a)*(ledge+noise(a,t)*.035);z+=Math.sin(a)*(ledge+noise(t,a)*.035);}
      else{const a=rand(0,Math.PI*2),t=rand(0,1),r=edge(a)*(.82*(1-t)+.1)+.08*Math.sin(t*18+a*7);x=Math.cos(a)*r;z=Math.sin(a)*r*.64;y=-1-t*(1.25+.25*Math.sin(a*6)+.12*Math.sin(a*13));}
      const j=i*3;basePositions[j]=x;basePositions[j+1]=y;basePositions[j+2]=z;
      scatterPositions[j]=rand(-5.5,5.5);scatterPositions[j+1]=rand(-4.5,4.5);scatterPositions[j+2]=rand(-4.5,4.5);
      const c=cols[Math.floor(Math.random()*cols.length)],shade=rand(.72,1.18);colors[j]=c.r*shade;colors[j+1]=c.g*shade;colors[j+2]=c.b*shade;
    }
    rockGeometry=new THREE.BufferGeometry();rockGeometry.setAttribute("position",new THREE.BufferAttribute(basePositions.slice(),3));rockGeometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
    rockMaterial=new THREE.PointsMaterial({size:mobile?.03:.021,vertexColors:true,transparent:true,opacity:.94,depthWrite:false,sizeAttenuation:true});
    island.add(new THREE.Points(rockGeometry,rockMaterial));
    const strataCount=mobile?1500:3200,sp=new Float32Array(strataCount*3),sc=new Float32Array(strataCount*3),strataColor=new THREE.Color("#d5b99a");
    for(let i=0;i<strataCount;i++){const a=rand(0,Math.PI*2),t=rand(.1,.95),r=edge(a)*(1-.13*t),x=Math.cos(a)*r,z=Math.sin(a)*r*.68,y=topHeight(x,z)-t*1.55+Math.sin(a*8+t*22)*.025,j=i*3,k=rand(.35,.8);sp[j]=x;sp[j+1]=y;sp[j+2]=z;sc[j]=strataColor.r*k;sc[j+1]=strataColor.g*k;sc[j+2]=strataColor.b*k;}
    const sg=new THREE.BufferGeometry();sg.setAttribute("position",new THREE.BufferAttribute(sp,3));sg.setAttribute("color",new THREE.BufferAttribute(sc,3));
    const strata=new THREE.Points(sg,new THREE.PointsMaterial({size:mobile?.022:.014,vertexColors:true,transparent:true,opacity:.36,depthWrite:false}));island.add(strata);

    island.userData.strata=strata;
    // Waterfall ribbons made from lightweight animated particles.
    const waterfallCount=mobile?480:900,waterBase=new Float32Array(waterfallCount*3),waterSpeeds=new Float32Array(waterfallCount),waterPositions=new Float32Array(waterfallCount*3),waterGeo=new THREE.BufferGeometry(),waterXs=[-1.62,-.12,1.48];
    for(let i=0;i<waterfallCount;i++){const j=i*3,s=i%3;waterBase[j]=waterXs[s]+rand(-.12,.12);waterBase[j+1]=rand(-.2,-2.9);waterBase[j+2]=rand(-.9,.9);waterPositions.set(waterBase.slice(j,j+3),j);waterSpeeds[i]=rand(.45,1.25);}
    waterGeo.setAttribute("position",new THREE.BufferAttribute(waterPositions,3));
    island.add(new THREE.Points(waterGeo,new THREE.PointsMaterial({color:0xb9d5d4,size:mobile?.025:.018,transparent:true,opacity:.66,depthWrite:false})));
    island.userData.water={geo:waterGeo,base:waterBase,speeds:waterSpeeds,count:waterfallCount};

    // Hanging moss and herb tips under the cliff edge.
    const vineCount=mobile?90:175,vineBase=new Float32Array(vineCount*3),vinePositions=new Float32Array(vineCount*3),vineColors=new Float32Array(vineCount*3),vineGeo=new THREE.BufferGeometry(),greens=["#526d43","#82935a","#a1a36a"].map(c=>new THREE.Color(c));
    for(let i=0;i<vineCount;i++){const a=rand(0,Math.PI*2),r=edge(a)*.94,j=i*3,x=Math.cos(a)*r,z=Math.sin(a)*r*.68;vineBase[j]=x;vineBase[j+1]=topHeight(x,z)-rand(.25,1.45);vineBase[j+2]=z;vinePositions.set(vineBase.slice(j,j+3),j);const c=greens[i%greens.length];vineColors[j]=c.r;vineColors[j+1]=c.g;vineColors[j+2]=c.b;}
    vineGeo.setAttribute("position",new THREE.BufferAttribute(vinePositions,3));vineGeo.setAttribute("color",new THREE.BufferAttribute(vineColors,3));
    island.add(new THREE.Points(vineGeo,new THREE.PointsMaterial({size:mobile?.035:.027,vertexColors:true,transparent:true,opacity:.92,depthWrite:false})));
    island.userData.vines={geo:vineGeo,base:vineBase,count:vineCount};

    // Warm leaves drift through the surrounding air.
    const leafCount=mobile?30:58,leafBase=new Float32Array(leafCount*3),leafPositions=new Float32Array(leafCount*3),leafColors=new Float32Array(leafCount*3),leafGeo=new THREE.BufferGeometry(),leafPalette=["#b8a05d","#d47a36","#7d9860"].map(c=>new THREE.Color(c));
    for(let i=0;i<leafCount;i++){const j=i*3;leafBase[j]=rand(-4.8,4.8);leafBase[j+1]=rand(-2.9,2.8);leafBase[j+2]=rand(-1.5,1.5);leafPositions.set(leafBase.slice(j,j+3),j);const c=leafPalette[i%3];leafColors[j]=c.r;leafColors[j+1]=c.g;leafColors[j+2]=c.b;}
    leafGeo.setAttribute("position",new THREE.BufferAttribute(leafPositions,3));leafGeo.setAttribute("color",new THREE.BufferAttribute(leafColors,3));
    scene.add(new THREE.Points(leafGeo,new THREE.PointsMaterial({size:mobile?.045:.035,vertexColors:true,transparent:true,opacity:.8,depthWrite:false})));
    island.userData.leaves={geo:leafGeo,base:leafBase,count:leafCount};
    const dustN=mobile?220:420,dp=new Float32Array(dustN*3);for(let i=0;i<dustN;i++){const j=i*3;dp[j]=rand(-7,7);dp[j+1]=rand(-4,4);dp[j+2]=rand(-4,-2);}
    const dg=new THREE.BufferGeometry();dg.setAttribute("position",new THREE.BufferAttribute(dp,3));scene.add(new THREE.Points(dg,new THREE.PointsMaterial({color:0xb8b0a3,size:.014,transparent:true,opacity:.3,depthWrite:false})));
    canvas.addEventListener("pointerdown",e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);canvas.style.cursor="grabbing";});
    addEventListener("pointerup",()=>{drag=false;canvas.style.cursor="grab";});
    addEventListener("pointermove",e=>{pointer.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight*2-1));if(drag){targetY+=(e.clientX-lastX)*.006;targetX+=(e.clientY-lastY)*.004;}else{targetY=pointer.x*.2;targetX=pointer.y*-.1;}lastX=e.clientX;lastY=e.clientY;},{passive:true});
    canvas.addEventListener("click",()=>pulse=1);canvas.style.cursor="grab";
    const clock=new THREE.Clock();
    const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0),hit=new THREE.Vector3();
    function animate(){
      raf=requestAnimationFrame(animate);const t=clock.getElapsedTime();
      rotX+=(targetX-rotX)*.045;rotY+=(targetY-rotY)*.045;
      island.rotation.x=rotX+Math.sin(t*.18)*.012+scrollMix*.1;
      island.rotation.y=rotY+(reduced?0:t*.012)+scrollMix*.32;
      island.rotation.z=Math.sin(t*.13)*.008;
      island.position.set(mobile?.35:1-scrollMix*.25,-.08+Math.sin(t*.35)*.025,0);
      island.scale.setScalar(1-scrollMix*.07);
      ray.setFromCamera(pointer,camera);ray.ray.intersectPlane(plane,hit);pulse*=.955;
      const arr=rockGeometry.attributes.position.array,mix=Math.pow(scrollMix,1.35);
      for(let i=0;i<count;i++){const j=i*3,x=basePositions[j],y=basePositions[j+1],z=basePositions[j+2],dx=x-hit.x,dy=y-hit.y,d=Math.sqrt(dx*dx+dy*dy+z*z),influence=Math.exp(-d*d*1.25)*.12,wave=Math.sin(d*7-t*3)*pulse*.035,force=influence+wave,den=Math.max(.01,d);arr[j]=x+dx/den*force+scatterPositions[j]*mix;arr[j+1]=y+dy/den*force+scatterPositions[j+1]*mix;arr[j+2]=z+scatterPositions[j+2]*mix;}
      rockGeometry.attributes.position.needsUpdate=true;rockMaterial.opacity=.94*(1-mix*.82);strata.material.opacity=.36*(1-mix);

      const wd=island.userData.water;if(wd){const p=wd.geo.attributes.position.array,b=wd.base;for(let i=0;i<wd.count;i++){const j=i*3;p[j]=b[j]+Math.sin(t*1.8+i)*.018;p[j+1]=.08-((t*wd.speeds[i])%3.15);p[j+2]=b[j+2]+Math.sin(t*1.2+i*.4)*.025;}wd.geo.attributes.position.needsUpdate=true;}
      const vd=island.userData.vines;if(vd){const p=vd.geo.attributes.position.array,b=vd.base;for(let i=0;i<vd.count;i++){const j=i*3;p[j]=b[j]+Math.sin(t*.8+i*.7)*.035;p[j+1]=b[j+1]+Math.sin(t*1.1+i)*.025;p[j+2]=b[j+2]+Math.cos(t*.7+i*.4)*.035;}vd.geo.attributes.position.needsUpdate=true;}
      const ld=island.userData.leaves;if(ld){const p=ld.geo.attributes.position.array,b=ld.base;for(let i=0;i<ld.count;i++){const j=i*3;p[j]=b[j]+Math.sin(t*.45+i)*.22;p[j+1]=b[j+1]+Math.sin(t*.7+i*.9)*.13-((t*.12+i*.037)%1)*.32;p[j+2]=b[j+2]+Math.cos(t*.4+i)*.12;}ld.geo.attributes.position.needsUpdate=true;}
      renderer.render(scene,camera);
    }
    animate();
  }catch(err){console.warn("Floating cliff renderer unavailable; keeping the hero layout.",err);canvas.style.display="none";}
}
function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.7));renderer.setSize(innerWidth,innerHeight);}
addEventListener("resize",resize,{passive:true});
if(!reduced)initCliff();
else canvas.style.display="none";
addEventListener("pagehide",()=>{cancelAnimationFrame(raf);renderer?.dispose();rockGeometry?.dispose();rockMaterial?.dispose();},{once:true});
