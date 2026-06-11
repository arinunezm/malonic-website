# Fase 2 · Automatización n8n + WhatsApp — guía de instalación

Cuatro workflows importables en [`automation/n8n/`](../automation/n8n/) que leen
Supabase (fase 1 activa) y notifican a Nico por WhatsApp usando la Meta Cloud
API que NeMo ya tiene aprobada. **Requisito: Fase 1 activada**
(docs/FASE1_SUPABASE.md).

> **ESTADO 2026-06-11: DESPLEGADO en el VPS.** Los 4 workflows ya están
> importados y ACTIVOS en el n8n del Hetzner (62.238.7.70). Credenciales en
> `/opt/nemo/malonic.env`, reutilizando el token+phone_id de WhatsApp de NeMo
> Pulse (mismo WABA). Esta guía queda como referencia/runbook. Notas de
> despliegue real abajo (§6).
>
> Gotchas de n8n 2.15.1 que encontramos:
> - Los **webhooks no se registran al activar por CLI** (modelo draft/published
>   de n8n 2.x). Por eso el workflow 01 se convirtió de webhook a **polling**
>   (cron cada minuto que consulta Supabase por solicitudes nuevas, con
>   `staticData.lastAt` para no duplicar). Sin dependencia de webhook ni de
>   configurar Database Webhook en Supabase.
> - **`$env` está bloqueado en expresiones por defecto**: hay que poner
>   `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` en el environment del compose.
> - Activar un workflow en 2.x: `docker exec n8n n8n publish:workflow --id=X`
>   y reiniciar (`update:workflow --active` está deprecado).

## 1 · Variables de entorno en n8n (una vez)

En el VPS, agregar al entorno del contenedor n8n (docker compose →
`environment:`, luego `docker compose up -d n8n`):

```
MALONIC_SUPABASE_URL=https://<proyecto>.supabase.co
MALONIC_SUPABASE_SERVICE_KEY=<service_role key — Settings → API>
MALONIC_WA_TOKEN=<token permanente Meta Cloud API (el de NeMo)>
MALONIC_WA_PHONE_ID=<phone number ID del WABA>
MALONIC_NICO_PHONE=52XXXXXXXXXX   # WhatsApp de Nico, formato E.164 sin '+'
```

⚠️ El **service_role key** nunca va en el sitio web — solo en n8n (servidor).

## 2 · Plantilla de WhatsApp (una vez)

Los 4 workflows usan UNA plantilla genérica de utilidad (aprobación rápida).
En Meta Business → WhatsApp → Message templates → Create:

- Nombre: `malonic_notificacion` · Categoría: **Utility** · Idioma: `es_MX`
- Body: `{{1}}`  (solo la variable — el workflow manda el texto completo)

Mientras se aprueba (~minutos-horas), se puede probar con mensajes de sesión
abierta: Nico le escribe "hola" al número del WABA y por 24 h los workflows
pueden usar `type: "text"` en lugar de plantilla (cambiar el nodo WhatsApp:
`{ type: 'text', text: { body: $json.mensaje } }`).

## 3 · Importar los workflows

n8n → Workflows → **Import from file** (uno por uno):

| Workflow | Trigger | Qué hace |
|---|---|---|
| `01-solicitud-nueva-whatsapp.json` | Webhook (lo llama Supabase) | Solicitud del sitio → WhatsApp inmediato a Nico |
| `02-recordatorio-sesiones-24h.json` | Diario 18:00 | Sesiones de mañana (hora, cliente, servicio, sin-depósito) |
| `03-cobranza-lunes.json` | Lunes 9:00 | Cuentas abiertas con balance, vencidos primero |
| `04-resumen-semanal.json` | Viernes 18:00 | Facturación, horas, completadas, por cobrar |

Activar cada uno (toggle **Active**) después de configurar las env vars.

## 4 · Conectar el webhook de solicitudes (workflow 01)

1. En n8n, abrir el workflow 01 → nodo Webhook → copiar la **Production URL**
   (`https://<n8n>/webhook/malonic-solicitud-nueva`).
2. Supabase Dashboard → **Database → Webhooks → Create**:
   - Table: `requests` · Events: **INSERT** · Method: POST → pegar la URL.

Desde ese momento, cada solicitud real del sitio dispara el WhatsApp.

## 5 · Probar

- Workflow 01: enviar el form de reservas del sitio → WhatsApp en segundos.
- Workflows 02–04: botón **Execute workflow** en n8n (corren con la data real;
  si no hay nada que avisar, terminan sin enviar — by design).

## Diseño

- Los crons leen el **documento operativo** (`documents.malonic-crm`) vía
  PostgREST con el service key y calculan en un nodo Code — cero dependencias
  nuevas, mismas fórmulas que la página de Analítica.
- Si no hay nada que reportar, el nodo Code devuelve `[]` y el envío se salta
  (sin nodos IF frágiles entre versiones de n8n).
- Zona horaria: cálculos de "mañana"/"semana" en `America/Monterrey`.
- Siguiente nivel (cuando se quiera): recordatorio directo AL CLIENTE 24 h
  antes (mismo workflow 02, segundo envío al teléfono del cliente — requiere
  capturar teléfono en la reserva y una plantilla aprobada dirigida a
  clientes), y webhook de Mercado Pago → marcar depósito pagado solo.
