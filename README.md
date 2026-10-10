# limites — un mod para Claude Code

Una linea sobre el prompt con lo unico que importa cuando trabajas todo el dia con
Claude Code: **cuanto contexto llevas gastado y cuanto te queda de tu plan.**

```
limites · contexto 42% · 5h 23% · 7d 61% · $1.20
```

- Se pinta sola encima de donde escribes. No hay que pedir nada.
- Cuando una ventana del plan pasa del **80%**, te salta un aviso. Una sola vez por ventana.
- `/limites` te da el detalle, con la hora a la que vuelve cada ventana.

Solo lee. No intercepta tus mensajes ni tus herramientas, asi que no puede bloquearte.

## Instalar

En una terminal con Claude Code abierto:

```
/plugin install limites --marketplace ngz-fernando/claude-code-limites
```

Te preguntara `Add marketplace?` → **y**, luego el scope (Enter para el de usuario).
Queda activo en esa sesion y en todas las que abras despues.

Necesitas Claude Code **2.1.287 o superior** en terminal (2.1.286 en la app de escritorio).
Comprueba con `claude --version` y actualiza con `claude update`.

## Para mirarlo por dentro

```
claude plugin validate .
claude plugin test .
```

Son tres archivos: el manifiesto, el modulo de hooks y el contrato de tipos.
Si quieres entender como esta hecho, abre `hooks/register.tsx`: son 100 lineas.

## Como funciona

| | |
|---|---|
| `session.measure` | El motor avisa cada vez que una cifra se mueve. Ahi guardo contexto, ventanas y gasto |
| `ui.render` sobre `AbovePrompt` | Dibuja la linea. Si no hay lectura todavia, no dibuja nada |
| `command.run` | Responde a `/limites` con el detalle |

Fuente de las cifras: `$.session.usage()`, las mismas que usa la linea de estado de
Claude Code.

---

Hecho por Fernando Navarro Gonzalez para [Imperio Agentico](https://www.skool.com/imperio).
