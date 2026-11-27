# Cloudflare Pages (opcional)
Conectar únicamente el repositorio sicorp-ventas. En Workers & Pages, crear un proyecto Pages mediante Git:
- Nombre: sicorpventas (sujeto a disponibilidad)
- Rama de producción: main
- Framework preset: None
- Build command: bash scripts/build-pages.sh
- Build output directory: dist
- Root directory: dejar vacío (raíz)
- Sin variables ni secretos adicionales.

El script prepara solo los recursos web existentes; no modifica Supabase, los registros ni las actualizaciones Android. La portada sirve el mismo portal privado desde la raíz. El almacenamiento local de cada origen web es independiente: sincroniza cualquier venta pendiente en la dirección anterior antes de cambiar. Si se desea indexar, solicitar la autorización de uso público del nombre empresarial, verificar la propiedad URL-prefix en Google Search Console y solicitar indexación de la portada. No publicar información privada ni tokens administrativos.
