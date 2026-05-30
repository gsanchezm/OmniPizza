# Perfil determinista para pruebas — seed/reset atómico — 2026-05-30

> **Para:** equipo de QA
> **TL;DR:** el perfil editable (`/api/users/me/profile`) es estado por-usuario mutable y compartido entre sesiones, así que cualquier guardado "se filtra" al siguiente render y rompe los baselines de regresión visual. Ahora tienes dos entradas atómicas para fijarlo: **`POST /api/profile`** (sembrar un valor congelado) y **`POST /api/session/reset`** (limpiar al default vacío). Commit `124b268`.

---

## El problema (confirmado)

- `GET /api/users/me/profile` responde **200** (no 404 — esa respuesta venía de un scaffolding/mock apuntando a la ruta equivocada; la ruta real es exactamente `/api/users/me/profile`).
- El valor es **compartido por username**: cualquier sesión que haga `PATCH` lo sobrescribe para todas. Por eso `standard_user` mostraba `田中 健太` / dirección de Shibuya / nota en francés (basura de varias corridas).
- Web y mobile **ambos** hidratan el formulario en el `mount` desde ese endpoint (web es la base; ya están alineados), así que el render heredaba el valor mutable.
- El perfil era **el único** estado por-usuario sin reset/seed atómico (cart y market ya tenían `POST /api/cart`, `POST /api/store/market`, `POST /api/session/reset`).

El default determinista ya existía en backend: un perfil fresco nace vacío (`full_name/phone/address/notes = ""`, `premium = true`). El fix expone cómo volver a ese estado o sembrar uno conocido, **sin** romper la feature ni cambiar el front.

---

## Endpoints nuevos / cambiados

Todos requieren `Authorization: Bearer <jwt>`. **No** requieren `X-Country-Code` (el perfil es independiente del mercado).

### `POST /api/profile` — sembrar baseline determinista
Reemplaza el perfil del usuario con: **defaults + los campos que mandes**. Los campos **omitidos vuelven al default** (no conservan lo que hubiera antes). Útil para congelar un valor antes del snapshot.

Body (todos opcionales): `full_name`, `phone`, `address`, `notes`, `premium`.

```bash
curl -X POST "$API/api/profile" \
  -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"full_name":"QA Baseline","phone":"+1 555 0100"}'
# -> {"username":"standard_user","premium":true,"full_name":"QA Baseline",
#     "phone":"+1 555 0100","address":"","notes":""}   (address/notes al default)
```

### `POST /api/session/reset` — clean slate por-usuario
Ahora, además de limpiar market + cart, **resetea el perfil al default vacío**.

```bash
curl -X POST "$API/api/session/reset" -H "Authorization: Bearer $JWT"
# luego GET /api/users/me/profile -> full_name/phone/address/notes = ""
```

---

## Cómo usarlo en regresión visual

Antes de navegar al perfil / tomar el snapshot, fija el estado:

- **Baseline "perfil vacío" (pre-edición):** `POST /api/session/reset`. El form renderiza inputs vacíos deterministas.
- **Baseline "perfil con datos":** `POST /api/profile` con el valor congelado que espera tu baseline.

Ambos hacen el render reproducible sin importar lo que cualquier sesión haya guardado antes.

> **Nota sobre concurrencia:** el estado sigue siendo compartido **por username**. Siembra/resetea **justo antes** del snapshot, y si corres en paralelo evita que dos suites usen el mismo username a la vez (o usa usuarios distintos). El seed inmediato-antes-del-snapshot es el patrón esperado.

---

## Matiz del header de la card (AC#3)

Con este enfoque el header queda **determinista** (lo controla el seed/reset), pero **sigue mostrando el `full_name`**, no el string `standard_user`. Tras un `reset` el `full_name` queda vacío y el header cae al placeholder hardcodeado `"Alexander Sterling"` (igual en web y mobile).

Si QA necesita **literalmente** el username en el header, eso es un cambio de frontend adicional que **revierte la decisión del triage B6** (donde `text-profile-username` se fijó para mostrar el `full_name` y el assert de Appium se re-apuntó a ese valor). No está incluido aquí; pedirlo explícitamente si se quiere.

---

## Aparte: bug pre-existente en la suite (no relacionado)

El test `User Behavior: Locked Out` (`tests/api.test.ts`) falla por una razón ajena a este cambio: el API devuelve el mensaje de bloqueo en el campo **`error`** (`{"error":"Sorry, this user has been locked out.","status_code":403}`), pero el test lee `.detail`. Es un campo equivocado en el test, no un bug del API. Pendiente de corregir en un commit aparte.

---

## Referencias

- Backend: `backend/test_api.py` (`seed_profile`, `reset_state`), `backend/database.py` (`seed_user_profile`, `reset_user_profile`), `backend/models.py` (`TestProfileSeedRequest`).
- Tests: `tests/api.test.ts` → describe `Atomic Profile Setup`.
- Swagger: `https://omnipizza-backend.onrender.com/api/docs` (tags **Profile** / **Session**).
- Commit: `124b268`.
