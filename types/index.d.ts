export type Ventana = { kind: string; percentUsed: number; resetsAt?: string }

export type Medida = {
  contexto: number | null
  ventanas: Ventana[]
  usd: number | null
}

declare module 'claude-code' {
  interface PluginState {
    limites: { medida: Medida | null; avisadas: string[] }
  }
}
