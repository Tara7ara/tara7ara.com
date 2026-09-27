# tara7ara.com

Este es el repo de mi web personal (portfolio, experiencia y CV), que está publicada en mi propio dominio: **[tara7ara.com](https://tara7ara.com)**.

Es HTML, CSS y un poco de JS a pelo, sin frameworks ni build. Todo lo que se publica está en `public/` y lo sirve Cloudflare Pages directamente desde este repo.

## La idea

Quería una web que se sintiera como las plantillas de Framer que tanto me gustan (imagen enorme al entrar, cosas que se mueven al hacer scroll, mucho contraste) pero hecha a mano, sin plantillas, sin cookies y sin cargar nada de fuera. Que se viera bien y que, además, si alguien de seguridad le echa un ojo, encuentre las cabeceras bien puestas.

- Negro puro, blanco puro y un solo color de acento: naranja `#ff9e64`.
- Cero dependencias: ni frameworks, ni fuentes externas, ni librerías de animación.
- Funciona sin JS (se pierde la animación, no el contenido) y respeta "reducir movimiento" del sistema.

## Las llamas de la portada

La tinta naranja del inicio no es un vídeo ni una imagen: se pinta en tiempo real en la GPU con un shader de WebGL (`public/ink.js`).

- **Ruido de gradiente + domain warping**: se generan varias capas de ruido (fbm) y se usan para deformar las coordenadas de otras capas de ruido. Eso es lo que da las formas de humo o tinta en agua en vez de manchas redondas.
- **Vetas**: sobre ese ruido deformado se aplica una onda senoidal diagonal, y así salen las franjas largas que parecen llamas.
- **Color**: el valor final se pasa por una rampa negro → brasa → óxido → naranja → melocotón.
- **Movimiento**: el tiempo desplaza el ruido muy despacio, así que se mueve fluido a la resolución de cada pantalla (no hay imagen que se estire en un monitor grande).
- **Sin escalones en el negro**: el oscurecido y el fundido con el fondo se hacen dentro del shader y se le añade un dithering finísimo. Con degradados CSS encima salían bandas en tonos tan oscuros.
- **No gasta de más**: solo se anima mientras la portada se ve y la pestaña está activa. Si no hay WebGL, se queda una imagen fija generada con el mismo algoritmo.

Al hacer scroll la tinta se oscurece y se acerca un poco.

## Scrollytelling

La web cuenta cosas mientras bajas (`public/app.js`, un solo listener de scroll con `requestAnimationFrame`, todo con `transform` y `opacity`):

1. **Portada**: el texto sube y se desvanece mientras la tinta se apaga.
2. **Frase fija**: la pantalla se queda quieta y las palabras se van encendiendo una a una.
3. **TaraTrack**: se queda fijo y va pasando por sus partes (Vistas, Pendientes, Duelos Glicko, Estadísticas), cambiando la captura y la explicación.
4. **Más proyectos**: carrusel horizontal que avanza con el scroll vertical.
5. **Experiencia y formación**: la línea de tiempo se rellena y los puntos se encienden al pasarlos.
6. **Stack**: tres cintas de tecnologías que se deslizan en direcciones opuestas.
7. **Contacto**: un "¿Hablamos?" gigante que crece al llegar.

En móvil no hay secciones fijas: TaraTrack se cambia pulsando los pasos, los proyectos se deslizan con el dedo y la barra de arriba se esconde al bajar.

## Privacidad y seguridad

- Sin cookies, sin analítica y sin cargar nada de terceros.
- Cabeceras de seguridad (CSP estricta sin `unsafe-inline`, HSTS, nosniff, Referrer-Policy, frame-ancestors) en `public/_headers`.
- El CV en PDF y `/legal` van con `X-Robots-Tag: noindex` para que no los indexen.
- `/legal` tiene el aviso legal y la política de privacidad.
- `/acceso` es la página a la que redirige Cloudflare Access cuando alguien sin permiso intenta entrar en TaraTrack.

## Estructura

```
public/
├── index.html      la web
├── styles.css      todo el diseño
├── app.js          scrollytelling, visor de capturas y detalles
├── ink.js          el shader de la portada
├── _headers        cabeceras de seguridad para Cloudflare Pages
├── legal.html      aviso legal y privacidad
├── acceso.html     página de acceso restringido a TaraTrack
├── 404.html
└── img/            imagen de respaldo de la portada y capturas de TaraTrack
```

## Verla en local

```sh
cd public && python -m http.server 8000
```

Y abrir `http://127.0.0.1:8000`.
