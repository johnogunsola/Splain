/* Splain's living identities. Self-contained WebGL2; no runtime dependencies.
 * Social icon paths: Bootstrap Icons, MIT (see THIRD-PARTY-NOTICES.txt).
 */
(() => {
  'use strict';
  const art = document.querySelector('.particle-art');
  if (!art) return;
  const canvas = art.querySelector('.particle-canvas');
  const stage = art.querySelector('.particle-stage');
  const fallback = art.querySelector('.particle-fallback');
  const profile = art.querySelector('.particle-profile');
  const status = art.querySelector('.particle-status');
  const countLabel = art.querySelector('.particle-top-count');
  const choices = [...art.querySelectorAll('.particle-choice')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  art.dataset.motion = motion.matches ? 'reduced' : 'full';
  const icons = {"github": "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8", "linkedin": "M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"};
  const identities = [
    { name: 'Splain', href: '#work', link: 'Explore my work', path: null },
    { name: 'GitHub', href: 'https://github.com/johnogunsola', link: 'Visit my GitHub', path: icons.github },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/in/john-ogunsola-bb0b773bb', link: 'Visit my LinkedIn', path: icons.linkedin },
  ];
  let selected = 0;
  let renderer = null;
  let inView = true;
  let frame = 0;
  let elapsed = 0;
  let lastTime = 0;
  let morphStart = -10;
  let pointerTarget = [0, 0, 0];
  const pointer = [0, 0, 0];

  function updateIdentity() {
    const identity = identities[selected];
    const next = identities[(selected + 1) % identities.length];
    art.dataset.identity = identity.name.toLowerCase();
    stage.setAttribute('aria-label', `${identity.name} particle logo. Click to transform into ${next.name}.`);
    profile.href = identity.href;
    profile.replaceChildren(document.createTextNode(identity.link + ' '));
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = selected ? '↗' : '↓';
    profile.append(arrow);
    if (selected) {
      profile.target = '_blank';
      profile.rel = 'noopener noreferrer';
      profile.setAttribute('aria-label', `${identity.link} (opens in a new tab)`);
    } else {
      profile.removeAttribute('target');
      profile.removeAttribute('rel');
      profile.setAttribute('aria-label', identity.link);
    }
    countLabel.textContent = `${String(selected + 1).padStart(2, '0')} / 03`;
    choices.forEach((button, index) => button.setAttribute('aria-pressed', String(index === selected)));
    status.textContent = `${identity.name} logo selected. ${selected ? identity.link + ' using the profile link.' : 'Click the artwork to discover my profiles.'}`;
    if (identity.path) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 16 16');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', identity.path);
      svg.append(path);
      fallback.replaceChildren(svg);
    } else {
      const text = document.createElement('span');
      text.textContent = 's.';
      fallback.replaceChildren(text);
    }
  }

  function selectIdentity(index) {
    if (index === selected) return;
    if (renderer) renderer.morph(index, elapsed, motion.matches);
    selected = index;
    updateIdentity();
    requestFrame();
  }
  stage.addEventListener('click', () => selectIdentity((selected + 1) % identities.length));
  choices.forEach((button, index) => button.addEventListener('click', () => selectIdentity(index)));
  stage.addEventListener('pointermove', event => {
    if (motion.matches || event.pointerType === 'touch') return;
    const bounds = stage.getBoundingClientRect();
    pointerTarget = [(event.clientX - bounds.left) / bounds.width * 2 - 1,
      1 - (event.clientY - bounds.top) / bounds.height * 2, 1];
    requestFrame();
  });
  stage.addEventListener('pointerleave', () => { pointerTarget[2] = 0; });

  // Sample each silhouette once. The same seeded particles retain their depth
  // and size across identities, so a click produces a continuous 3D morph.
  function sampleShapes(count) {
    let seed = 82307;
    const random = () => {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = random();
    const mask = document.createElement('canvas');
    mask.width = mask.height = 384;
    const ctx = mask.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Logo sampling unavailable');
    const shapes = identities.map(identity => {
      ctx.clearRect(0, 0, 384, 384);
      ctx.fillStyle = '#fff';
      if (identity.path) {
        ctx.save();
        ctx.translate(32, 32);
        ctx.scale(20, 20);
        ctx.fill(new Path2D(identity.path));
        ctx.restore();
      } else {
        ctx.font = 'bold 340px Arial, Helvetica, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('s.', 181, 296);
      }
      const pixels = ctx.getImageData(0, 0, 384, 384).data;
      const filled = [], edges = [];
      let minX = 384, maxX = 0, minY = 384, maxY = 0;
      for (let y = 1; y < 383; y++) for (let x = 1; x < 383; x++) {
        const offset = (y * 384 + x) * 4;
        if (pixels[offset + 3] < 160) continue;
        filled.push(x, y);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        if (pixels[offset - 4 + 3] < 160 || pixels[offset + 4 + 3] < 160 ||
            pixels[offset - 384 * 4 + 3] < 160 || pixels[offset + 384 * 4 + 3] < 160) edges.push(x, y);
      }
      if (!filled.length) throw new Error('Empty logo silhouette');
      const scale = 1.68 / Math.max(maxX - minX, maxY - minY);
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const onEdge = seeds[i * 4 + 2] > 0.75 && edges.length;
        const pool = onEdge ? edges : filled;
        const index = Math.floor(random() * pool.length / 2) * 2;
        positions[i * 3] = (pool[index] + random() - (minX + maxX) / 2) * scale;
        positions[i * 3 + 1] = ((minY + maxY) / 2 - pool[index + 1] - random()) * scale;
        // Dense front/back surfaces and a dust-filled bevel around the edge.
        const z = seeds[i * 4] * 2 - 1;
        positions[i * 3 + 2] = (onEdge ? z : Math.sign(z) * (0.84 + Math.abs(z) * 0.16)) * 0.19;
      }
      return positions;
    });
    return { shapes, seeds };
  }

  const vertexSource = `#version 300 es
  precision highp float;
  layout(location=0) in vec3 aFrom;
  layout(location=1) in vec3 aTo;
  layout(location=2) in vec4 aSeed;
  uniform float uTime, uMorph, uMotion, uDpr, uHeight, uAspect, uGlow;
  uniform vec3 uPointer;
  out float vLight, vSeed, vAlpha;
  mat3 rotateY(float a) { float c=cos(a),s=sin(a); return mat3(c,0,-s,0,1,0,s,0,c); }
  mat3 rotateX(float a) { float c=cos(a),s=sin(a); return mat3(1,0,0,0,c,s,0,-s,c); }
  void main() {
    float ease=uMorph*uMorph*(3.0-2.0*uMorph);
    vec3 p=mix(aFrom,aTo,ease);
    float burst=sin(uMorph*3.14159265)*0.32;
    float phase=aSeed.x*6.2831853;
    p+=burst*vec3(cos(phase)*(0.4+aSeed.y),sin(phase)*(0.4+aSeed.y),(aSeed.z-0.5)*1.8);
    float t=uTime*0.48;
    vec3 flow=vec3(sin(p.y*9.0+t+phase),cos(p.x*8.0-t+phase),sin(p.x*7.0+p.y*6.0+t));
    p+=flow*(0.009+aSeed.w*0.013)*uMotion;
    mat3 rotation=rotateY((0.22+sin(uTime*0.24)*0.30+uPointer.x*0.12)*uMotion)
      *rotateX((-0.10+cos(uTime*0.19)*0.10-uPointer.y*0.08)*uMotion);
    p=rotation*p;
    float perspective=2.9/(2.9-p.z);
    vec2 projected=p.xy*perspective*0.74;
    vec2 cursor=uPointer.xy*vec2(uAspect,1.0);
    vec2 difference=projected-cursor;
    float influence=exp(-dot(difference,difference)*24.0)*uPointer.z*uMotion;
    projected+=normalize(difference+vec2(0.0001))*influence*0.16;
    projected+=vec2(-difference.y,difference.x)*influence*0.25;
    gl_Position=vec4(projected.x/uAspect,projected.y+0.075,-p.z*0.5,1.0);
    float size=(0.85+pow(aSeed.y,3.0)*2.15)*uDpr*(uHeight/420.0)*perspective;
    gl_PointSize=max(1.0,size)*(uGlow>0.5?3.8:1.0);
    vec3 normal=rotation*normalize(vec3(p.xy*0.25,sign(aTo.z)*0.85));
    vLight=0.42+0.58*max(0.0,dot(normal,normalize(vec3(-0.6,0.9,1.0))));
    vSeed=aSeed.w;
    vAlpha=(0.48+0.45*aSeed.z)*(1.0-influence*0.25);
  }`;

  const fragmentSource = `#version 300 es
  precision highp float;
  in float vLight,vSeed,vAlpha;
  uniform float uGlow;
  out vec4 color;
  void main() {
    vec2 q=gl_PointCoord*2.0-1.0;
    float r=dot(q,q);
    if(r>1.0) discard;
    vec3 lime=vec3(0.71,0.93,0.50);
    vec3 pearl=vec3(0.94,1.0,0.86);
    if(uGlow>0.5) { color=vec4(lime,exp(-r*4.0)*0.026*vAlpha); return; }
    float sphere=max(0.0,dot(normalize(vec3(q,sqrt(max(0.0,1.0-r)))),normalize(vec3(-0.5,0.7,1.0))));
    vec3 ink=mix(lime*0.40,pearl,vLight*(0.35+0.65*sphere));
    ink=mix(ink,lime,0.12+vSeed*0.10);
    gl_FragDepth=gl_FragCoord.z-sqrt(max(0.0,1.0-r))*0.0005;
    color=vec4(ink,(1.0-smoothstep(0.65,1.0,r))*vAlpha);
  }`;

  const backgroundVertex = `#version 300 es
  precision highp float;
  out vec2 uv;
  void main(){
    vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
    uv=p; gl_Position=vec4(p*2.0-1.0,0,1);
  }`;
  const backgroundFragment = `#version 300 es
  precision highp float;
  in vec2 uv;
  uniform float uTime,uAspect,uMotion;
  uniform vec3 uPointer;
  out vec4 color;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);}
  void main(){
    vec2 p=(uv-0.5)*vec2(uAspect,1.0);
    float t=uTime*0.07*uMotion;
    vec2 mouse=uPointer.xy*0.5;
    float wake=exp(-length(p-mouse)*3.5)*uPointer.z*uMotion;
    float wave=sin(p.y*3.2+t+noise(p*2.0+t)*1.8)*0.18;
    float ribbons=pow(max(0.0,1.0-abs(sin((p.x+wave+wake*0.07)*9.0+t))),7.0);
    ribbons*=0.35+noise(vec2(p.x*5.0,p.y*2.0-t))*0.65;
    float halo=exp(-dot(p,p)*4.0);
    vec3 base=vec3(0.065,0.087,0.067);
    base+=vec3(0.09,0.16,0.065)*ribbons*(0.3+halo*0.7);
    base+=vec3(0.055,0.075,0.025)*halo;
    float vignette=1.0-smoothstep(0.2,0.9,length(p))*0.45;
    float grain=(hash(gl_FragCoord.xy)-0.5)*0.012;
    color=vec4(base*vignette+grain,1);
  }`;

  function createRenderer() {
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: true, powerPreference: 'default' });
    if (!gl || gl.isContextLost()) throw new Error('WebGL2 unavailable');
    const resources = [];
    const count = window.matchMedia('(max-width: 700px)').matches ? 26000 : 65000;
    const { shapes, seeds } = sampleShapes(count);
    let from = shapes[selected].slice();
    let to = shapes[selected];
    let drawCount = count;
    let maxDpr = 1.75;
    const program = (vs, fs) => {
      const result = gl.createProgram();
      resources.push(['program', result]);
      for (const [type, source] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          const message = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(message);
        }
        gl.attachShader(result, shader); gl.deleteShader(shader);
      }
      gl.linkProgram(result);
      if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(result));
      return result;
    };
    const particleProgram = program(vertexSource, fragmentSource);
    const backgroundProgram = program(backgroundVertex, backgroundFragment);
    const locations = program => Object.fromEntries(['Time','Morph','Motion','Dpr','Height','Aspect','Glow','Pointer']
      .map(name => [name, gl.getUniformLocation(program, 'u' + name)]));
    const particles = locations(particleProgram), background = locations(backgroundProgram);
    const vao = gl.createVertexArray();
    resources.push(['vertexArray', vao]);
    gl.bindVertexArray(vao);
    const attribute = (location, size, data, usage) => {
      const buffer = gl.createBuffer(); resources.push(['buffer', buffer]);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, data, usage);
      gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
      return buffer;
    };
    const fromBuffer = attribute(0, 3, from, gl.DYNAMIC_DRAW);
    const toBuffer = attribute(1, 3, to, gl.DYNAMIC_DRAW);
    attribute(2, 4, seeds, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    gl.disable(gl.DEPTH_TEST);
    const upload = () => {
      gl.bindBuffer(gl.ARRAY_BUFFER, fromBuffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, from);
      gl.bindBuffer(gl.ARRAY_BUFFER, toBuffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, to);
    };
    const progress = time => Math.max(0, Math.min(1, (time - morphStart) / 1.55));
    if (!motion.matches && elapsed < 0.1) {
      // The opening ring gathers into Splain; no blocking loading screen.
      from = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const angle = seeds[i * 4] * Math.PI * 2;
        const tube = seeds[i * 4 + 1] * Math.PI * 2;
        const radius = 0.57 + Math.cos(tube) * 0.11;
        from[i * 3] = Math.cos(angle) * radius;
        from[i * 3 + 1] = Math.sin(angle) * radius;
        from[i * 3 + 2] = Math.sin(tube) * 0.16;
      }
      morphStart = elapsed + 0.25;
      upload();
    }
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const width = Math.max(1, Math.round(stage.clientWidth * dpr));
      const height = Math.max(1, Math.round(stage.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      gl.viewport(0, 0, width, height);
      return dpr;
    };
    art.dataset.particles = String(drawCount);
    return {
      draw(time) {
        const dpr = resize(), aspect = canvas.width / canvas.height;
        gl.disable(gl.DEPTH_TEST); gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.disable(gl.BLEND); gl.bindVertexArray(null); gl.useProgram(backgroundProgram);
        gl.uniform1f(background.Time, time); gl.uniform1f(background.Aspect, aspect);
        gl.uniform1f(background.Motion, motion.matches ? 0 : 1);
        gl.uniform3fv(background.Pointer, pointer); gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.useProgram(particleProgram); gl.bindVertexArray(vao);
        gl.uniform1f(particles.Time, time); gl.uniform1f(particles.Morph, progress(time));
        gl.uniform1f(particles.Motion, motion.matches ? 0 : 1);
        gl.uniform1f(particles.Dpr, dpr); gl.uniform1f(particles.Height, stage.clientHeight);
        gl.uniform1f(particles.Aspect, aspect); gl.uniform3fv(particles.Pointer, pointer);
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.uniform1f(particles.Glow, 1); gl.drawArrays(gl.POINTS, 0, drawCount);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS);
        gl.uniform1f(particles.Glow, 0); gl.drawArrays(gl.POINTS, 0, drawCount);
        gl.bindVertexArray(null);
      },
      morph(index, time, instant) {
        // Capture the current local positions, including the transition arc.
        // Rapid clicks can retarget immediately without resetting the cloud.
        const t = progress(time), eased = t * t * (3 - 2 * t);
        const burst = Math.sin(t * Math.PI) * 0.32;
        for (let i = 0; i < count; i++) {
          const angle = seeds[i * 4] * Math.PI * 2;
          const spread = 0.4 + seeds[i * 4 + 1];
          from[i * 3] += (to[i * 3] - from[i * 3]) * eased + burst * Math.cos(angle) * spread;
          from[i * 3 + 1] += (to[i * 3 + 1] - from[i * 3 + 1]) * eased + burst * Math.sin(angle) * spread;
          from[i * 3 + 2] += (to[i * 3 + 2] - from[i * 3 + 2]) * eased + burst * (seeds[i * 4 + 2] - 0.5) * 1.8;
        }
        to = shapes[index];
        morphStart = instant ? time - 2 : time;
        upload();
      },
      settle() { from = to.slice(); morphStart = -10; upload(); },
      lowerQuality() { maxDpr = 1; drawCount = Math.floor(count * 0.6); art.dataset.particles = String(drawCount); },
      dispose() {
        for (const [type, resource] of resources) {
          if (type === 'program') gl.deleteProgram(resource);
          if (type === 'buffer') gl.deleteBuffer(resource);
          if (type === 'vertexArray') gl.deleteVertexArray(resource);
        }
      },
    };
  }

  let slowFrames = 0, measuredFrames = 0, frameTime = 0, lowered = false;
  function animate(now) {
    frame = 0;
    if (!renderer || !inView || document.hidden) { lastTime = 0; return; }
    const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
    if (lastTime && !motion.matches && elapsed > 3 && !lowered) {
      frameTime += now - lastTime; measuredFrames++;
      if (measuredFrames === 90) {
        slowFrames = frameTime / measuredFrames > 30 ? slowFrames + 1 : 0;
        measuredFrames = frameTime = 0;
        if (slowFrames >= 2) { renderer.lowerQuality(); lowered = true; }
      }
    }
    lastTime = now;
    if (!motion.matches) elapsed += delta;
    const smooth = 1 - Math.exp(-delta * 9);
    for (let i = 0; i < 3; i++) pointer[i] += (pointerTarget[i] - pointer[i]) * smooth;
    if (motion.matches) pointer.fill(0);
    renderer.draw(elapsed);
    if (!motion.matches) requestFrame();
  }
  function requestFrame() {
    if (!frame && renderer && inView && !document.hidden) frame = requestAnimationFrame(animate);
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function initialize() {
    try {
      renderer = createRenderer();
      if (motion.matches) renderer.settle();
      art.dataset.renderer = 'webgl2';
      requestFrame();
    } catch (error) {
      renderer?.dispose(); renderer = null;
      art.dataset.renderer = 'fallback';
      console.warn('Splain particle artwork is using its static fallback.', error);
    }
  }
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); stop(); renderer = null;
    art.dataset.renderer = 'fallback';
  });
  canvas.addEventListener('webglcontextrestored', initialize);
  motion.addEventListener('change', () => {
    art.dataset.motion = motion.matches ? 'reduced' : 'full';
    stop(); pointer.fill(0); pointerTarget = [0, 0, 0];
    if (motion.matches) renderer?.settle();
    requestFrame();
  });
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : requestFrame(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      inView ? requestFrame() : stop();
    }, { threshold: 0 }).observe(art);
  }
  if ('ResizeObserver' in window) new ResizeObserver(requestFrame).observe(stage);
  else window.addEventListener('resize', requestFrame);
  updateIdentity();
  initialize();
})();
