# Tick Attack

Juego arcade mobile-first hecho con Vue 3 donde controlas un perro y debes evitar o aplastar garrapatas mientras avanzan las oleadas.

## Sobre el juego

- Formato vertical pensado para móvil.
- Sistema de vidas y puntaje.
- Enemigos con distintos comportamientos y dificultad progresiva.
- Habilidad especial de spray con uso limitado por nivel.
- Transiciones de nivel y última oleada.
- Soporte PWA para despliegue como aplicación web instalable.

## Tecnologías usadas

- Vue 3
- TypeScript
- Vite
- Tailwind CSS v4
- `vite-plugin-pwa`

## Cómo correrlo localmente

### Requisitos

- Node.js 18 o superior
- npm

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

Esto levanta el servidor local de Vite. Abre la URL que aparece en la terminal, normalmente `http://localhost:5173`.

### Build de producción

```bash
npm run build
```

### Vista previa del build

```bash
npm run preview
```

## Estructura general

- `src/components/`: interfaz y sprites del juego
- `src/composables/`: lógica reutilizable para Vue
- `src/core/`: engine, estado y reglas del juego
- `src/models/`: tipos e interfaces
- `public/`: imágenes, sonidos e iconos

## Versionado

El proyecto ya incluye `.gitignore` para evitar subir artefactos generados como `node_modules/`, `dist/` y archivos locales del sistema.



## Creditos

Musica de fondo:

Autor: bluelike_u 
- Perfil: https://pixabay.com/es/users/bluelike_u-24430674/
- Music: 1 Popcorn | Cute BGM

Efectos de sonido:

Autor: floraphonic 
- Perfil: https://pixabay.com/es/users/floraphonic-38928062/
- Sound: Goopy Slime 20

Autor: freesound_community 
- Perfil: https://pixabay.com/es/users/freesound_community-46691455/
- Sound: Spray
- Sound: Golpe en madera
- Sound: chajchas2

Autor: freesounds123 
- Perfil: https://pixabay.com/es/users/freesounds123-49985424/
- Sound: Crunchy Bite 2

Autor: DRAGON STUDIO
- Perfil: https://pixabay.com/es/users/dragon-studio-38165424/
- Sound: Button Press 3