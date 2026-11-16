import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
import { animate, createTimeline, onScroll } from 'https://cdn.jsdelivr.net/npm/animejs@4.0.2/+esm';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
$('#year').textContent=new Date().getFullYear();
const toggle=$('.menu-toggle'),nav=$('.desktop-nav');
if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});$$('a',nav).forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}));}
const canvas=$('#machine-canvas'),stage=$('#machine-stage'),fallback=$('#machine-fallback'),reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer,scene,camera,root,resizeObserver,groupMap={},explodeProgress=0,manualOverride=false,dragging=false,lastX=0,lastY=0;
const groupOrder=['front','core','housing','gears','threads','rear','fasteners','internal'];
const groupStrength={front:1.05,core:.72,housing:.1,gears:.7,threads:1.15,rear:1.5,fasteners:.48,internal:.58};
const groupDirection={front:-1,core:-.45,housing:0,gears:.5,threads:.95,rear:1,fasteners:.3,internal:-.25};
function setProgress(p){explodeProgress=Math.max(0,Math.min(1,p));manualOverride=true;for(const name of groupOrder){const g=groupMap[name];if(!g)continue;const k=explodeProgress;const d=groupDirection[name]*groupStrength[name];g.position.x=g.userData.base.x+d*k*2.4;g.position.y=g.userData.base.y+(name==='fasteners'?0.45:Math.sin(groupOrder.indexOf(name)*1.4)*.16)*k;g.position.z=g.userData.base.z+(name==='fasteners'?.55:Math.cos(groupOrder.indexOf(name)*1.2)*.12)*k;g.rotation.y=g.userData.rotY+(name==='gears'?.12:0)*k;}
$('#machine-progress-fill').style.width=`${explodeProgress*100}%`;
const state=explodeProgress>.94?'EXPLODED':explodeProgress<.03?'ASSEMBLED':'SEPARATING';$('#system-state').textContent=state;$('#sequence-readout').textContent=`${state} — ${String(Math.round(explodeProgress*100)).padStart(2,'0')}%`;
$('#scroll-instruction').textContent=explodeProgress>.94?'SCROLL UP TO REASSEMBLE ↑':'SCROLL TO DISASSEMBLE ↓';$('#assemble-btn').classList.toggle('active',explodeProgress<.03);$('#explode-btn').classList.toggle('active',explodeProgress>.97);}
if(canvas&&stage){try{
 renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.set(0,.55,10.8);
 scene.add(new THREE.HemisphereLight(0xe8dfd1,0x17120e,2.1));const key=new THREE.DirectionalLight(0xffe2c5,3.4);key.position.set(3,5,7);scene.add(key);const rim=new THREE.PointLight(0xd96b32,55,18);rim.position.set(-3,1,2);scene.add(rim);const fill=new THREE.PointLight(0x9aa7b5,24,15);fill.position.set(4,-2,-3);scene.add(fill);
 root=new THREE.Group();scene.add(root);
 const loader=new GLTFLoader();loader.load('assets/models/outframe-m01.glb',async gltf=>{
  const model=gltf.scene;root.add(model);const meta=await fetch('assets/models/machine-parts.json').then(r=>{if(!r.ok)throw Error('Metadata could not be loaded');return r.json();});
  const partMap=new Map(meta.parts.map(p=>[p.name,p]));for(const name of groupOrder){const g=new THREE.Group();g.name=`M01_${name}`;root.add(g);groupMap[name]=g;g.userData.base=new THREE.Vector3();g.userData.rotY=0;}
  model.updateMatrixWorld(true);const meshes=[];model.traverse(o=>{if(o.isMesh){meshes.push(o);const m=partMap.get(o.name);if(m&&groupMap[m.group])groupMap[m.group].attach(o);}});root.remove(model);root.scale.setScalar(.9);root.rotation.set(-.12,-.28,0);
  // Keep the complete model centered after regrouping and preserve local mesh transforms.
  const bounds=new THREE.Box3().setFromObject(root),center=bounds.getCenter(new THREE.Vector3());for(const g of Object.values(groupMap)){g.position.sub(center);g.userData.base.copy(g.position);g.userData.rotY=g.rotation.y;}
  if(fallback)fallback.style.display='none';setProgress(0);
  const fit=()=>{const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=window.innerWidth<800?12.8:10.8;camera.updateProjectionMatrix();};resizeObserver=new ResizeObserver(fit);resizeObserver.observe(stage);fit();
  const clock=new THREE.Clock();const render=()=>{requestAnimationFrame(render);const t=clock.getElapsedTime();if(!reduceMotion&&!dragging){root.rotation.y=-.28+Math.sin(t*.18)*.045;for(const n of ['gears'])if(groupMap[n])groupMap[n].rotation.x=Math.sin(t*.6)*.018;}renderer.render(scene,camera);};render();
  $('#assemble-btn').addEventListener('click',()=>{animate({p:explodeProgress},{p:0,duration:850,ease:'outExpo',onUpdate:a=>setProgress(a.p)});});$('#explode-btn').addEventListener('click',()=>{animate({p:explodeProgress},{p:1,duration:1050,ease:'inOutCubic',onUpdate:a=>setProgress(a.p)});});$('#reset-view-btn').addEventListener('click',()=>{root.rotation.set(-.12,-.28,0);animate({p:explodeProgress},{p:0,duration:700,ease:'outExpo',onUpdate:a=>setProgress(a.p)});});
  stage.addEventListener('pointerdown',e=>{if(e.target!==canvas)return;dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!dragging)return;root.rotation.y+=(e.clientX-lastX)*.006;root.rotation.x+=(e.clientY-lastY)*.004;lastX=e.clientX;lastY=e.clientY;});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
  window.addEventListener('scroll',()=>{if(manualOverride){manualOverride=false;}const r=$('#machine-sequence').getBoundingClientRect(),span=$('#machine-sequence').offsetHeight-window.innerHeight;const p=span>0?Math.max(0,Math.min(1,-r.top/span)):0;setProgress(p);},{passive:true});
 },undefined,err=>{console.error('[OUTFRAME] M01 load failed',err);if(fallback)fallback.textContent='M01 MODEL UNAVAILABLE — CHECK ASSET PATHS';});
}catch(err){console.error('[OUTFRAME] 3D engine unavailable',err);if(fallback)fallback.textContent='3D VIEW UNAVAILABLE — THE STUDIO REMAINS FULLY ACCESSIBLE';}}
if(!reduceMotion){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;animate(entry.target,{opacity:[0,1],translateY:[24,0],duration:760,ease:'outExpo'});observer.unobserve(entry.target);}),{threshold:.12});$$('.manifesto-grid,.section-heading,.capability,.work-card,.process-steps article,.contact-main').forEach(el=>observer.observe(el));$$('.work-card').forEach(card=>{const art=$('.work-art',card);card.addEventListener('mouseenter',()=>animate(art,{scale:1.025,duration:420,ease:'outExpo'}));card.addEventListener('mouseleave',()=>animate(art,{scale:1,duration:420,ease:'outExpo'}));});}
