# Mastery Module

App para entender matemática, estadística, economía y finanzas: escribís un tema, la IA lo explica a tu nivel con
ejemplos de lo que te gusta, te toma un quiz y después te lo hace repasar con repetición espaciada (SM-2).

Producción: <https://mastery-module.vercel.app>

## Cómo está armada

| Parte | Dónde |
|---|---|
| Frontend (React + Vite) | `src/` — `App.jsx` (sesión y ruteo), `LandingPage.jsx`, `module/` (estudio), `views/` (repaso, mapa, perfil, admin) |
| Repetición espaciada | `src/srs.js` |
| IA (Vercel Function) | `api/claude.js` — verifica la sesión, aplica límites, llama a Claude y registra el costo en `usage_logs` |
| Modelos y precios | `api/_lib/models.js` |
| Gestión de usuarios (admin) | `api/admin-users.js` — confirmación de email, reenviar, bloquear, eliminar, totales de uso |
| Base de datos y login | Supabase (`profiles`, `study_history`, `review_cards`, `usage_logs`) |
| Capturas de la landing | `scripts/shots/` (ver el encabezado de `capture.py`) |

## Límites de uso

Los controla `api/claude.js` contra la tabla `usage_logs`, así valen aunque Vercel use varios servidores. Cada pedido
reserva su fila antes de llamar a la IA, así que los pedidos en curso también cuentan. Valores en `LIMITS`:
$0,40 por usuario por día (UTC), 20 llamadas por minuto y 200 por hora. Los admins no tienen límite.

## Variables de entorno (Vercel)

- `ANTHROPIC_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (límites, registro de uso y panel de admin)
- `SUPABASE_URL` y `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (opcionales; hay valores por defecto)

## Desarrollo

```shell
npm install
npm run dev      # app local
npm test         # pruebas (Vitest)
npm run build    # build de producción
```

Cada pull request corre pruebas y build (`.github/workflows/ci.yml`). `keep_alive.yml` hace un ping diario a Supabase
para que el plan gratis no pause el proyecto.
