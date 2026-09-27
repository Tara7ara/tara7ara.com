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

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
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
      vec3 c0 = vec3(11.0, 11.0, 12.0) / 255.0;
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
      vec2 p = vec2(frag.x, res.y - frag.y) / res.y * 1.5;
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
      float light = pow(clamp(0.35 + 0.95 * uv.x - 0.55 * uv.y, 0.08, 1.0), 1.1);
      float fade = 1.0 - smoothstep(0.55, 0.97, uv.y);
      v *= light * fade;

      vec3 col = ramp(v);
      // dithering para que no se vean escalones en los degradados
      col += (hash(frag + fract(time)) - 0.5) / 255.0;
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

  // Se renderiza por debajo de la resolución nativa: la tinta es suave y así no pesa en pantallas 4K
  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.75;
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
  const start = performance.now() - 20000;

  function draw(now) {
    resize();
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - start) / 1000);
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
