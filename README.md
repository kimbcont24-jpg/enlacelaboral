# Enlace RD · Enlace Laboral

Plataforma dominicana de empleo: conecta talento con oportunidades reales.

- Sitio: https://enlace-rd.vercel.app
- Panel de administración: https://enlace-rd.vercel.app/admin

## Cómo funciona

- **Código:** este repositorio. Cada cambio que se sube aquí se publica solo en Vercel en 1–2 minutos.
- **Datos** (vacantes, aplicaciones, textos): base de datos Supabase. Se editan desde el panel `/admin`, sin tocar código.
- **Publicar vacantes:** en el panel, pegar el texto o subir la imagen del anuncio, revisar y tocar *Publicar*.

## Desarrollo local

```bash
npm install
npm run dev
```

La clave de `.env` es la clave pública (publishable) de Supabase; la seguridad de los datos la dan las reglas de la base de datos.
