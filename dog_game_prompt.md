## 🎯 OBJETIVO
Desarrolla un juego tipo “dodge / esquivar objetos” (Dodge Dog) utilizando **Vue 3 + TailwindCSS v4 + TypeScript**, optimizado para **móvil en orientación vertical**, con arquitectura limpia, escalable y preparado como **PWA**.

---
## 🎮 Descripción del juego

- El jugador controla un personaje dentro de un área rectangular visible (viewport del juego).
- El personaje puede moverse:
  - izquierda / derecha (principal)
  - ligeramente arriba / abajo (limitado)
- El control debe ser táctil (drag o touch) y opcionalmente soportar acelerómetro.

## ☄️ Objetos (obstáculos)
- Caen desde la parte superior hacia abajo.
- Tipos:
  - Grandes → velocidad entre 1 y 4 (más lentos)
  - Pequeños → velocidad entre 4 y 8 (más rápidos)
- Propiedades:
  - posición (x, y)
  - velocidad
  - tamaño
  - dirección (vertical o diagonal)
- Comportamiento:
  - Algunos objetos deben moverse diagonalmente (↘ o ↙) por un tiempo y luego continuar hacia abajo.
  - Deben desaparecer al salir de la pantalla o al colisionar con el jugador.

## 💥 Colisiones
- Implementar detección de colisiones tipo bounding box.
- Si un objeto colisiona con el jugador:
  - reducir vidas
  - eliminar objeto
- Si un objeto llega al final sin colisionar:
  - incrementar puntuación

## ❤️ Sistema de juego
- El jugador tiene un número de vidas (configurable).
- Mostrar:
  - puntuación
  - vidas restantes
- Cuando las vidas llegan a 0 → estado de Game Over.

## 🔄 Game Loop
- Usar requestAnimationFrame para actualizar:
  - posiciones
  - colisiones
  - render visual

## 🎨 UI/UX
- Estilo minimalista, limpio y moderno (mobile-first).
- Usar TailwindCSS v4.
- Animaciones suaves:
  - movimiento con transform (translate)
  - evitar top/left para performance
- Feedback visual:
  - impacto al colisionar
  - animaciones suaves en movimiento
- Optimizado para pantallas móviles (responsive).

## ⚙️ Arquitectura (MUY IMPORTANTE)
Estructura clara y escalable:

- Separar lógica en módulos:
  - game engine / loop
  - player controller
  - obstacle manager
  - collision system
  - state manager (vidas, score, estado del juego)

- Usar composición de Vue 3 (Composition API)
- Tipado fuerte con TypeScript
- Evitar lógica mezclada en componentes grandes
- Crear interfaces/types para entidades del juego

## 📁 Estructura sugerida
- components/
- composables/
- core/ (lógica del juego)
- models/ (tipos/interfaces)
- utils/

## 🚀 Performance
- Limitar cantidad de objetos simultáneos
- Limpiar objetos fuera de pantalla
- Usar transform + will-change
- Evitar reflows innecesarios

## 🧪 Extras (si es posible)
- Sistema básico de dificultad progresiva
- Reutilización de objetos (pooling simple)
- Configuración centralizada (velocidades, spawn rate, etc.)

## 📦 Entrega esperada
- Código completo funcional
- Bien comentado
- Fácil de extender para futuros minijuegos
- Sin dependencias innecesarias

Enfócate en entregar código limpio, bien organizado y listo para producción.

## Control de versiones
- Preparar el proyecto para subirse a Git.
- Incluir un `.gitignore` apropiado para un proyecto con Vite/Vue/TypeScript.
- No versionar `node_modules/`, `dist/`, archivos `.env` ni artefactos locales del sistema/editor.
- Mantener `package-lock.json` versionado para asegurar instalaciones reproducibles.

