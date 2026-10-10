import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Medida, Ventana } from '../types'

const AVISO = 80

const medida = atom({ plugin: 'limites', key: 'medida' } as const, null)
const avisadas = atom({ plugin: 'limites', key: 'avisadas' } as const, [])

const nombre = (kind: string): string =>
  kind === 'five_hour' ? '5h' : kind === 'seven_day' ? '7d' : kind === 'spend_limit' ? 'gasto' : kind

const pct = (n: number): string => `${Math.round(n)}%`

const linea = (m: Medida): string => {
  const trozos: string[] = []
  if (m.contexto !== null) trozos.push(`contexto ${pct(m.contexto)}`)
  for (const v of m.ventanas) trozos.push(`${nombre(v.kind)} ${pct(v.percentUsed)}`)
  if (m.usd !== null) trozos.push(`$${m.usd.toFixed(2)}`)
  return trozos.join(' · ')
}

const cuandoVuelve = (v: Ventana): string => {
  if (v.resetsAt === undefined) return ''
  const falta = Date.parse(v.resetsAt) - Date.now()
  if (Number.isNaN(falta) || falta <= 0) return ''
  const horas = Math.floor(falta / 3600000)
  const minutos = Math.round((falta % 3600000) / 60000)
  return horas > 0 ? ` (vuelve en ${horas}h ${minutos}m)` : ` (vuelve en ${minutos}m)`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'limites',
      description: 'Cuanto te queda: contexto, ventanas del plan y gasto',
    })

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    const nueva: Medida = {
      contexto: e.context.percent ?? null,
      ventanas: e.rateLimits.map(v => ({
        kind: v.kind,
        percentUsed: v.percentUsed,
        resetsAt: v.resetsAt,
      })),
      usd: e.cost?.usd ?? null,
    }
    await update($, medida, () => nueva)

    const pasadas = nueva.ventanas.filter(v => v.percentUsed >= AVISO)
    if (pasadas.length > 0) {
      const ya = await read($, avisadas)
      const nuevas = pasadas.filter(v => !ya.includes(v.kind))
      if (nuevas.length > 0) {
        await update($, avisadas, lista => [...lista, ...nuevas.map(v => v.kind)])
        const texto = nuevas.map(v => `${nombre(v.kind)} al ${pct(v.percentUsed)}`).join(', ')
        $.ui.toast(`Ojo con los limites: ${texto}`)
      }
    }

    return next(e)
  })

  on('command.run', { command: 'limites' }, async $ => {
    const m = await read($, medida)
    if (m === null) {
      return { text: 'Todavia no hay lectura. Manda un mensaje y vuelve a pedirlo.' }
    }

    const filas: string[] = []
    filas.push(m.contexto === null ? 'Contexto: sin lectura' : `Contexto: ${pct(m.contexto)} de la ventana`)
    if (m.ventanas.length === 0) {
      filas.push('Ventanas del plan: ninguna (pasa con API de pago)')
    } else {
      for (const v of m.ventanas) {
        filas.push(`${nombre(v.kind)}: ${pct(v.percentUsed)}${cuandoVuelve(v)}`)
      }
    }
    if (m.usd !== null) filas.push(`Gasto de esta sesion: $${m.usd.toFixed(2)}`)

    return { text: filas.join('\n') }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const m = await read($, medida)
    if (m === null || e.props.hasSurvey) {
      return next(e)
    }

    const texto = linea(m)
    if (texto === '') {
      return next(e)
    }

    const apurado = m.ventanas.some(v => v.percentUsed >= AVISO)
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box>
        <Text dimColor={!apurado} color={apurado ? 'yellow' : undefined}>
          limites · {texto}
        </Text>
      </Box>
    )
  })
}
