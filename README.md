# PIBE Hub TI

Portal interno del Departamento de Sistemas de PIBE LOGISTIC / CLOC LOGISTIC: inicio con dashboard, inventario de equipos y responsivas, e inventario de correos.

## Estructura

```
index.html                         ← Inicio (dashboard)
manifest.json                      ← Instalación como programa (debe estar en la raíz)
sw.js                              ← Service worker (debe estar en la raíz)
imagenes/
  logos/                           ← Logos PIBE y CLOC (se usan en las responsivas)
  iconos/                          ← Iconos de cada apartado e iconos de la app
paginas/
  correos/correos.html             ← Inventario de correos
  inventario/inventario.html       ← Inventario de equipos y responsivas
```

## Publicar en GitHub Pages
1. Sube todo el contenido de esta carpeta a tu repositorio (el `index.html` queda en la raíz).
2. En GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Elige la rama `main` y la carpeta `/ (root)` y guarda.
4. Tu sitio queda en `https://TU-USUARIO.github.io/TU-REPOSITORIO/`.

Para actualizar, vuelve a subir los archivos cambiados al repositorio.

## Accesos iniciales
Inventario y Correos tienen cada uno su propia lista de usuarios. El administrador inicial es `admin` / `admin123`: **cámbiala al entrar por primera vez**.

## Importante
- Los datos se guardan en el navegador de cada persona (no se comparten entre equipos). Usa **Respaldo global (.json)** desde el inicio.
- Si el repositorio es público, cualquiera con el enlace puede abrir la página. No subas datos reales a los archivos.
- Mantén las carpetas tal como están: las páginas buscan sus imágenes con rutas relativas.
- Los estilos e iconos de interfaz requieren internet.
