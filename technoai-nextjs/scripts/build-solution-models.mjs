import * as T from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { writeFile } from 'node:fs/promises';

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) { this.result = await blob.arrayBuffer(); this.onloadend?.(); }
};
const material = (color, metalness=.35) => new T.MeshStandardMaterial({color,metalness,roughness:.38});
const steel=material(0xa6b3bc), dark=material(0x34444b), glass=material(0x182f41), teal=material(0x45c6c8), solar=material(0x223e64), black=material(0x131e23);
teal.emissive.setHex(0x104849);
const group=(p,name,x=0,y=0,z=0)=>{const g=new T.Group();g.name=name;g.position.set(x,y,z);p.add(g);return g};
function mesh(p,geo,m,x,y,z){const o=new T.Mesh(geo,m);o.position.set(x,y,z);p.add(o);return o}
function box(p,m,x,y,z,w,h,d,r=.025){return mesh(p,new RoundedBoxGeometry(w,h,d,1,Math.min(r,w/3,h/3,d/3)),m,x,y,z)}
function cyl(p,m,x,y,z,r,h){return mesh(p,new T.CylinderGeometry(r,r,h,24),m,x,y,z)}
function track(o,axis,angles){const vals=angles.flatMap(a=>new T.Quaternion().setFromAxisAngle(axis,a).toArray());return new T.QuaternionKeyframeTrack(o.name+'.quaternion',angles.map((_,i)=>i*2),vals,T.InterpolateLinear)}
const X=new T.Vector3(1,0,0),Y=new T.Vector3(0,1,0);
function industry(root){
 box(root,dark,0,.1,0,3.4,.2,1.9);box(root,teal,0,.19,0,3.3,.035,1.8);
 box(root,dark,-.22,.72,0,1.9,1.03,1.12);
 for(let i=0;i<3;i++){const x=-.85+i*.62;box(root,steel,x,1.31,0,.68,.085,1.18).rotation.z=.25;box(root,glass,x,1.1,.57,.54,.19,.035)}
 box(root,steel,-.64,.55,.58,.66,.66,.06);
 for(let i=0;i<7;i++)box(root,dark,-.64,.28+i*.085,.62,.6,.018,.018);
 for(const x of [-1.38,1.12]){cyl(root,steel,x,.82,-.15,.24,1.25);for(const y of [.34,.8,1.4])cyl(root,dark,x,y,-.15,.25,.04)}
 for(const x of [-.92,-.55]){cyl(root,steel,x,1.55,-.35,.085,.94);cyl(root,teal,x,1.98,-.35,.092,.05)}
 box(root,dark,.42,.65,.59,.48,.76,.07);
 const fan=group(root,'VentFan',.42,.7,.65);for(let i=0;i<5;i++){const blade=group(fan,'Blade'+i);blade.rotation.z=i*Math.PI*2/5;box(blade,steel,.08,0,0,.18,.065,.035)}
 cyl(root,steel,.1,.38,.71,.055,1.85).rotation.z=Math.PI/2;
 return [track(fan,new T.Vector3(0,0,1),[0,Math.PI/2,Math.PI,Math.PI*1.5,Math.PI*2])];
}
function satellite(root){
 box(root,steel,0,0,0,.85,.8,.78);box(root,dark,0,.33,0,.9,.09,.82);
 for(const side of [-1,1]){cyl(root,steel,side*.56,0,0,.06,.35).rotation.z=Math.PI/2}
 const wings=group(root,'ArrayHinges');
 for(const side of [-1,1]){box(wings,steel,side*1.4,0,0,1.52,.82,.07);for(let r=0;r<3;r++)for(let c=0;c<6;c++)box(wings,solar,side*(.78+c*.245),(r-1)*.25,.045,.23,.235,.028)}
 const dish=group(root,'TrackingDish',0,-.15,.47);
 const profile=Array.from({length:13},(_,i)=>{const r=i*.035;return new T.Vector2(r,r*r*.9)});
 const bowl=mesh(dish,new T.LatheGeometry(profile,36),steel.clone(),0,0,0);bowl.material.side=T.DoubleSide;bowl.rotation.x=Math.PI/2;
 cyl(dish,steel,0,0,.18,.025,.38).rotation.x=Math.PI/2;
 return [track(wings,X,[-.17,.05,.22,.05,-.17]),track(dish,Y,[-.2,0,.2,0,-.2])];
}
function security(root){
 box(root,steel,0,.28,-.85,.58,.84,.12);box(root,dark,0,.07,-.5,.18,.17,.65);
 cyl(root,steel,0,.24,-.22,.15,.41);
 const head=group(root,'CameraPan',0,.56,-.22);
 box(head,dark,0,0,.28,.64,.5,1.05,.075);box(head,steel,0,.19,.32,.72,.23,1.18,.08);
 const lens=cyl(head,glass,0,-.025,.824,.16,.09);lens.rotation.x=Math.PI/2;
 for(let i=0;i<12;i++){let a=i*Math.PI/6;cyl(head,steel,.21*Math.cos(a),-.025+.18*Math.sin(a),.817,.023,.025).rotation.x=Math.PI/2}
 return [track(head,Y,[-.45,-.28,.23,.45,.23,-.28,-.45])];
}
function financial(root){
 box(root,steel,0,.09,0,1.04,.18,.75);box(root,dark,0,.85,0,.8,1.5,.48);
 const face=group(root,'Console',0,1.62,.02);face.rotation.x=-.25;
 box(face,steel,0,0,0,.91,1.12,.22);box(face,glass,0,.15,.13,.76,.64,.05);
 for(let i=0;i<3;i++)box(face,teal,-.15,.33-i*.12,.165,.33-i*.06,.025,.015);
 for(let r=0;r<4;r++)for(let c=0;c<3;c++)box(face,steel,-.29+c*.084,-.24-r*.07,.14,.071,.055,.046);
 box(face,black,.18,-.33,.14,.24,.29,.095);box(root,black,0,.72,.252,.5,.06,.028);
 const card=group(root,'PaymentCard',.18,1.3,.4);box(card,teal,0,0,0,.36,.21,.023);box(card,steel,-.09,.02,.018,.065,.05,.014);
 return [new T.VectorKeyframeTrack('PaymentCard.position',[0,1.5,2.4,3.6,5],[.37,1.18,.58,.18,1.3,.32,.18,1.3,.32,.37,1.18,.58,.37,1.18,.58])];
}
for(const [slug,build] of Object.entries({industry,satellite,security,financial})){
 const scene=new T.Scene();const tracks=build(scene);
 const clip=new T.AnimationClip(slug,-1,tracks);
 const bytes=await new GLTFExporter().parseAsync(scene,{binary:true,animations:[clip]});
 await writeFile(new URL('../public/redesign/models/'+slug+'.glb',import.meta.url),Buffer.from(bytes));
}
