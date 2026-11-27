# SICORP Ventas Web — piloto 2.0
Esta rama no modifica la APK ni publica una actualización. No usar aún para ventas reales.

## Activación
1. Crear un proyecto Supabase dedicado, con plan gratuito si sus límites son suficientes.
2. Ejecutar la migración SQL de supabase/migrations en ese proyecto vacío.
3. Deshabilitar altas públicas de usuarios. Crear una sola cuenta de correo/password (correo controlado por el propietario o alias dedicado). El propietario elige la clave maestra directamente en Supabase; no enviarla por chat, ni escribirla en código.
4. Con la API de administración Auth, desde un entorno de confianza, asignar a esa cuenta app_metadata.sicorp_admin = true (booleano JSON). No usar user_metadata ni exponer la service_role. El propietario debe iniciar sesión de nuevo después de cambiar los permisos.
5. Copiar web/config.example.json a web/config.json y rellenar URL HTTPS del proyecto, clave pública publishable/anon y correo técnico de la cuenta. El correo y la clave publishable serán visibles en el navegador; no son la clave maestra. Si se desea ocultar el correo técnico, utilizar un endpoint de autenticación del servidor.
6. Desplegar por HTTPS únicamente los archivos web (con config.json) y catalogo.json en el nivel superior, manteniendo web/ como subdirectorio. No publicar archivos privados. Probar el portal antes de habilitarlo en producción.
7. Pruebas imprescindibles: anónimo y otra cuenta sin sicorp_admin no pueden leer ni escribir ventas ni archivos; propietario sí puede; cierre de sesión limpia vistas; reintento de venta con mismo UUID no duplica; dos navegadores muestran la misma venta al recargar historial. No permitir datos de clientes ni uso en equipos de la tienda sin autorización.

## Alcance actual
- Portal web con clave única visible, selección múltiple usando el catálogo real, listado de últimas 50 ventas y carga/descarga privada de evidencias (10 MB máximo por archivo).
- Token solo en memoria, cierre por 5 min de inactividad o vencimiento. El navegador o el equipo administrado puede capturar contraseñas o conservar descargas; no descargar archivos en equipos compartidos.
- Sin conexión no permite guardar ventas web. El UUID pendiente se mantiene solo durante la sesión; si hay fallo de red y se cierra la sesión, verificar historial antes de volver a registrar. No hay edición o eliminación aún.
- No se ha ejecutado la migración en un servidor ni probado con credenciales reales.
- No hay compresión automática, copias de seguridad ni actualización en vivo del listado todavía.

## Siguiente fase Android
El index.html actual pesa más de 5 MB y contiene recursos embebidos; el conector no devuelve su contenido completo. Inspeccionar el archivo localmente en un clon y el modelo de datos actual antes de diseñar la migración.
1. Exportar/resguardar SharedPreferences sales/records sin modificar sus datos.
2. Diseñar importación idempotente con IDs persistentes y reconciliación de históricos, con verificación de conteos.
3. Conservar catálogo e interfaz actuales. Implementar autenticación y transporte HTTPS nativo, credenciales de sesión protegidas con Android Keystore, cola persistente offline y sincronización incremental de ventas; nunca incrustar service_role o clave maestra.
4. Añadir evidencia privada con selección de imágenes y compresión opcional, manteniendo originales si el usuario los necesita.
5. Probar en una APK separada, preservando la versión instalada y su historial, antes de publicar un release.
