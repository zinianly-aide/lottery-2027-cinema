export function createRamBloom(T,renderer,scene,camera){
 const full=new T.WebGLRenderTarget(960,540),a=new T.WebGLRenderTarget(480,270),b=new T.WebGLRenderTarget(480,270);
 const post=new T.Scene(),cam=new T.OrthographicCamera(-1,1,1,-1,0,1);
 const uniforms={src:{value:null},base:{value:full.texture},direction:{value:new T.Vector2()},compose:{value:0}};
 const mat=new T.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`varying vec2 v;uniform sampler2D src,base;uniform vec2 direction;uniform float compose;void main(){vec3 sum=vec3(0.);float total=0.;for(int i=-6;i<=6;i++){float x=float(i);float w=exp(-x*x/13.);vec3 c=texture2D(src,v+direction*x).rgb;sum+=c*w;total+=w;}sum/=total;if(compose>.5)sum=texture2D(base,v).rgb+sum*.65;gl_FragColor=vec4(sum,1.);}`});
 post.add(new T.Mesh(new T.PlaneGeometry(2,2),mat));
 let width=0,height=0;
 return {render(){const size=renderer.getSize(new T.Vector2());if(size.x!==width||size.y!==height){width=size.x;height=size.y;full.setSize(width,height);a.setSize(Math.round(width/2),Math.round(height/2));b.setSize(Math.round(width/2),Math.round(height/2));}
 renderer.setRenderTarget(full);renderer.render(scene,camera);
 uniforms.compose.value=0;uniforms.src.value=full.texture;uniforms.direction.value.set(2/width,0);renderer.setRenderTarget(a);renderer.render(post,cam);
 uniforms.src.value=a.texture;uniforms.direction.value.set(0,2/height);renderer.setRenderTarget(b);renderer.render(post,cam);
 uniforms.src.value=b.texture;uniforms.direction.value.set(0,0);uniforms.compose.value=1;renderer.setRenderTarget(null);renderer.render(post,cam);
 }};
}