import { test, expect } from 'claude-code/testing'

const MEDIDA = {
  context: { window: 200000, tokens: 84000, percent: 42 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 23 },
    { kind: 'seven_day', percentUsed: 61 },
  ],
  cost: { usd: 1.2 },
  changed: ['context', 'rateLimits', 'cost'],
}

test('sin lectura todavia, /limites lo dice', async $ => {
  const salida = await $.command.run({ command: 'limites', args: '' })

  expect(salida.text).toContain('Todavia no hay lectura')
})

test('con lectura, /limites da contexto, ventanas y gasto', async ($, on) => {
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('ui.toast', () => ({ value: undefined }))

  await $.session.measure(MEDIDA)
  const salida = await $.command.run({ command: 'limites', args: '' })

  expect(salida.text).toContain('Contexto: 42%')
  expect(salida.text).toContain('5h: 23%')
  expect(salida.text).toContain('7d: 61%')
  expect(salida.text).toContain('$1.20')
})

test('avisa una sola vez cuando una ventana pasa del 80', async ($, on) => {
  const avisos: string[] = []
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('ui.toast', (_, e) => {
    avisos.push(String((e as { text?: string }).text ?? ''))
    return { value: undefined }
  })

  const apurado = { ...MEDIDA, rateLimits: [{ kind: 'five_hour', percentUsed: 86 }] }
  await $.session.measure(apurado)
  await $.session.measure(apurado)

  expect(avisos.length).toBe(1)
  expect(avisos[0]).toContain('5h al 86%')
})
