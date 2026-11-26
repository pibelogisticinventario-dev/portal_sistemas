# PIBE Hub TI

Portal interno del Departamento de Sistemas de PIBE LOGISTIC / CLOC LOGISTIC: inicio con dashboard, inventario de equipos y responsivas, e inventario de correos.

## Estructura

```
index.html                         ← Inicio (dashboard)
manifest.json  sw.js               ← Instalación como programa (deben estar en la raíz)
js/
  config.js                        ← AQUÍ se pega la URL de la nube (ver abajo)
  nube.js                          ← Guardado compartido en la nube
imagenes/
  logos/                           ← Logos PIBE y CLOC (se usan en las responsivas)
  iconos/                          ← Iconos de cada apartado e iconos de la app
paginas/
  correos/correos.html             ← Inventario de correos
  inventario/inventario.html       ← Inventario de equipos y responsivas
```

## Guardar los datos para todos (IMPORTANTE)

GitHub Pages solo muestra páginas: **no guarda datos**. Sin configurar la nube, lo que captures se queda
únicamente en el navegador de quien lo escribió y no lo verá nadie más (por eso se perdía al compartir el enlace).
Con la nube activada todo se guarda solo y lo ve cualquier persona que abra el enlace.

Pasos (5 minutos, gratis):

1. Entra a https://console.firebase.google.com con una cuenta de Google y crea un proyecto (puedes desactivar Analytics).
2. Menú **Build → Realtime Database → Create Database**. Elige la ubicación y empieza en modo bloqueado.
3. En la pestaña **Rules** pega esto y pulsa **Publish**:
   ```json
   {
     "rules": {
       "pibe": { ".read": true, ".write": true }
     }
   }
   ```
4. En la pestaña **Data** copia la URL de arriba (algo como `https://mi-proyecto-default-rtdb.firebaseio.com`).
5. Abre `js/config.js`, pégala en `databaseURL`, guarda y sube el cambio a GitHub.
6. Abre la página: abajo aparece **☁️ Sincronizado**. Lo que ya tenías capturado en ese navegador se sube automáticamente.

Cómo funciona:
- Cada cambio se guarda en la nube solo (indicador al pie: ☁️ Sincronizado / Guardando / Sin conexión).
- Al abrir o refrescar la página se carga lo guardado; no se pierde nada.
- Si otra persona guarda cambios mientras tienes la página abierta, aparece un aviso con el botón **Actualizar**.
- Si dos personas guardan al mismo tiempo, los registros se combinan. Un registro eliminado por una persona podría reaparecer si la otra lo tenía abierto.
- Sin internet, los cambios quedan en el navegador y se suben al reconectar.

### Seguridad: léelo antes de usarlo con datos reales
- Con esas reglas, **cualquiera que conozca la URL de la base de datos puede leer y modificar los datos**. La URL queda visible en `js/config.js`, y si el repositorio es público, para todos.
- Ahí se guardan, entre otros, las contraseñas de las cuentas de correo y las de los usuarios normales (las de administrador van cifradas). El acceso con usuario y contraseña de la página protege la pantalla, **no** la base de datos.
- Recomendado: usa un repositorio privado, no compartas la URL, haz respaldos con **Respaldo global (.json)** y, si manejarás información sensible, pide agregar autenticación real con Firebase Authentication y reglas que exijan inicio de sesión.

## Publicar en GitHub Pages
1. Sube todo el contenido de esta carpeta a tu repositorio (el `index.html` queda en la raíz).
2. **Settings → Pages → Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. Tu sitio queda en `https://TU-USUARIO.github.io/TU-REPOSITORIO/`. Para actualizar, vuelve a subir los archivos cambiados.

## Accesos iniciales
Inventario y Correos tienen cada uno su lista de usuarios. El administrador inicial es `admin` / `admin123`: **cámbiala al entrar por primera vez**.

## Notas
- Mantén las carpetas tal como están: las páginas buscan sus archivos con rutas relativas.
- Los estilos e iconos de interfaz requieren internet.
