# CILIS RESEARCH — GitHub Pages

Destino previsto: https://concordiacilis.github.io/

## Publicación

1. Inicia sesión en GitHub con acceso a la cuenta u organización `concordiacilis`.
2. Crea el repositorio `concordiacilis.github.io` bajo ese propietario. Si ya existe, revisa su contenido antes de reemplazar archivos.
3. Para usar GitHub Free, el repositorio debe ser público.
4. Descomprime este paquete y sube su contenido a la raíz de la rama `main`. No subas el ZIP como un solo archivo. `index.html` debe quedar en la raíz junto a `assets` y `.nojekyll`.
5. Abre Settings > Pages > Build and deployment.
6. Elige Source: Deploy from a branch; Branch: main; Folder: /(root). Pulsa Save.
7. Espera al despliegue y abre https://concordiacilis.github.io/ . Los cambios pueden tardar hasta 10 minutos.

## Archivos

- index.html: contenido principal.
- assets/styles.css: estilos.
- assets/main.js: interacciones.
- assets/convocatorias.js: títulos, abstracts y referencias de imágenes.
- assets/convocatorias/: flyers y abstracts originales.
- assets/research-hero.png: portada.
- login.html, registro.html, cuenta.html: acceso, registro y espacio inicial de usuario.
- assets/auth-config.js: URL y clave pública del proyecto Supabase de CILIS.
- assets/auth-client.js, assets/login.js, assets/registro.js, assets/cuenta.js: integración de autenticación.
- .nojekyll: sirve los archivos estáticos sin procesamiento Jekyll.

No requiere npm, compilación ni un servidor de aplicaciones. Las fuentes se descargan de Google Fonts con fuentes de respaldo; WhatsApp usa el número configurado 593967701604.

## Acceso a la plataforma

El enlace «Iniciar sesión» aparece en la cabecera de todas las páginas y lleva a un formulario con opción «Registrarse». Se implementaron los flujos de registro con correo y contraseña, confirmación por correo, inicio y cierre de sesión mediante Supabase Auth. `cuenta.html` muestra el correo del usuario después de comprobarlo con Supabase; su contenido es solo una bienvenida hasta que se desarrolle la plataforma. No debe colocarse información privada en archivos estáticos de GitHub Pages.

Proyecto creado: **CILIS Research**, organización **cilis**, plan **Free**, región **Canada (Central)**, URL `https://gtgakwqfljmbipjzijym.supabase.co`. El proveedor de correo está activo y exige confirmación. En Authentication > URL Configuration ya se estableció `https://concordiacilis.github.io/` como Site URL y `https://concordiacilis.github.io/cuenta.html` como Redirect URL. `assets/auth-config.js` contiene la clave **pública**; nunca colocar una clave `secret` o `service_role` en el sitio.

Para terminar la activación pública:

1. El SMTP personalizado de Mailjet ya está activado en Supabase para los correos de autenticación. La cuenta usa el plan gratuito (hasta 200 correos diarios según Mailjet). La contraseña SMTP permanece únicamente en la configuración privada de Supabase; no debe añadirse a este repositorio.
2. Se envió un registro de prueba el 14 de octubre de 2026. Supabase lo aceptó, Mailjet lo marcó como entregado y el mensaje apareció en la carpeta Spam de Gmail. El remitente de prueba usa Gmail; Mailjet advierte que este tipo de dirección puede afectar la entrega. Para uso público sostenido conviene autenticar un dominio propio.
3. Publicar los archivos en GitHub Pages y probar registro, recepción de la confirmación, acceso y cierre de sesión. Revisar también los límites de correo en Authentication > Rate Limits.

La futura plataforma deberá proteger cada tabla o recurso con reglas de acceso de Supabase (RLS), ya que GitHub Pages no puede proteger archivos HTML con una sesión del navegador.

Los abstracts de CPAP y ARN/lipoproteína(a) siguen pendientes. Se preservó la discrepancia de inositol: título 396, resultados 371 pacientes.

Este ZIP prepara los archivos; no crea por sí mismo una cuenta, un repositorio ni una publicación.
