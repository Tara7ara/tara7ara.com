// Tinta líquida de la portada, dibujada en la GPU con WebGL.
// Si no hay WebGL se queda la imagen fija de fondo (.hero-bg).
(() => {
  const canvas = document.getElementById('ink');
  if (!canvas) return;

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;

  const vert = `
    attribute vec2 pos;
    void main() { gl_Position = vec4(pos, 0.0, 1.0); }
  `;

  const frag = `
    precision highp float;
    uniform vec2 res;
    uniform float time;
    uniform float scroll;

    // hash22 de Dave Hoskins (MIT), sin seno para evitar patrones
    vec2 hash2(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
    }

    // ruido de gradiente con interpolación quíntica: sin costuras de rejilla
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      float a = dot(hash2(i), f);
      float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
      float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
      float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 0.85 + 0.5;
    }

    float fbm(vec2 p) {
      float s = 0.0;
      float amp = 0.5;
      mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 4; i++) {
        s += amp * noise(p);
        p = rot * p * 2.0;
        amp *= 0.5;
      }
      return s;
    }

    vec3 ramp(float t) {
      vec3 c0 = vec3(0.0);
      vec3 c1 = vec3(34.0, 12.0, 6.0) / 255.0;
      vec3 c2 = vec3(110.0, 38.0, 14.0) / 255.0;
      vec3 c3 = vec3(214.0, 104.0, 52.0) / 255.0;
      vec3 c4 = vec3(255.0, 158.0, 100.0) / 255.0;
      vec3 c5 = vec3(255.0, 222.0, 196.0) / 255.0;
      vec3 c = mix(c0, c1, smoothstep(0.0, 0.25, t));
      c = mix(c, c2, smoothstep(0.25, 0.5, t));
      c = mix(c, c3, smoothstep(0.5, 0.75, t));
      c = mix(c, c4, smoothstep(0.75, 0.92, t));
      c = mix(c, c5, smoothstep(0.92, 1.0, t));
      return c;
    }

    void main() {
      vec2 frag = gl_FragCoord.xy;
      vec2 uv = vec2(frag.x / res.x, 1.0 - frag.y / res.y);
      vec2 p = vec2(frag.x, res.y - frag.y) / res.y * (1.5 - 0.25 * scroll);
      float t = time * 0.035;

      vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - vec2(t * 0.7, 0.0)));
      vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.6),
                    fbm(p + 4.0 * q + vec2(8.3, 2.8) - t * 0.4));
      float f = fbm(p + 4.0 * r);

      float flow = (p.x * 0.75 - p.y * 0.65) * 2.2 + 3.2 * r.x + 1.4 * f;
      float vein = pow(0.5 + 0.5 * sin(flow * 3.0), 3.0);
      float glow = clamp((f - 0.25) / 0.5, 0.0, 1.0);
      float v = clamp(0.55 * vein + 0.6 * glow * vein + 0.25 * glow * glow, 0.0, 1.0);

      // luz arriba a la derecha, sombra donde va el texto y fundido total al negro del fondo abajo
      // luz repartida por todo el ancho, un poco más fuerte arriba
      float light = clamp(1.0 - 0.35 * uv.y + 0.1 * uv.x, 0.0, 1.0);
      float fade = 1.0 - smoothstep(0.5, 0.96, uv.y);
      float shade = 1.0;
      // zona del texto de la portada (abajo a la izquierda): la tinta se apaga para que el nombre destaque
      // en pantallas verticales el texto ocupa todo el ancho, así que la zona oscura también
      float wide = step(res.y, res.x);
      float textZone = smoothstep(0.3, 0.55, uv.y) * (1.0 - smoothstep(mix(0.95, 0.5, wide), mix(1.4, 0.82, wide), uv.x));
      shade *= 1.0 - 0.85 * textZone;
      v *= light * fade * shade * (1.0 - 0.6 * scroll);

      vec3 col = ramp(v);
      // dithering para que no se vean escalones en los degradados
      col = max(col + hash2(frag + fract(time) * 17.0).x * 0.75 / 255.0, 0.0);
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }

  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'res');
  const uTime = gl.getUniformLocation(prog, 'time');
  const uScroll = gl.getUniformLocation(prog, 'scroll');

  // Se renderiza por debajo de la resolución nativa: la tinta es suave y así no pesa en pantallas 4K
  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(canvas.clientWidth * scale);
    const h = Math.round(canvas.clientHeight * scale);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true;
  let raf = 0;
  // Cada visita arranca en un momento distinto de la animación (entre 0 y 10 minutos)
  const start = performance.now() - Math.random() * 600000;

  function draw(now) {
    resize();
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform1f(uScroll, window.inkScroll || 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop(now) {
    draw(now);
    raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  }

  function play() {
    if (!still && !raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
  }

  draw(performance.now());
  canvas.classList.add('ready');
  canvas.parentElement.classList.add('has-ink');

  if (still) {
    window.addEventListener('resize', () => draw(performance.now()));
    return;
  }

  // Solo se anima mientras la portada está en pantalla y la pestaña visible
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    play();
  }).observe(canvas);
  document.addEventListener('visibilitychange', play);
  play();
})();
