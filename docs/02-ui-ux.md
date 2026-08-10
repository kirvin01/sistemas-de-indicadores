# 02 — Directrices UI/UX

## Objetivo

Guiar el diseño visual del Frontend (shadcn/ui + Tailwind) con narrativa de datos clara.

## Alcance

- Login, shell, admin, pacientes e indicadores FED

## Regla 60-30-10

| Peso | Uso | Valores |
|------|-----|---------|
| 60% | Neutros | Fondo `#F8FAFC`, cards `#FFFFFF` |
| 30% | Estructura | Texto `#1E293B`, bordes `#E2E8F0`, muted |
| 10% | Acento | Teal primario `#0F766E` (positivo) |

Color semántico (solo en datos / ink, no en fondos grandes):

- Positivo / avance: teal-emerald
- Comparación: sky/cobalto `#0EA5E9`
- Crítico / meta: rose `#E11D48`

## Principios

1. Cards `rounded-xl`, sombra ligera, `gap-4`/`gap-6`
2. KPIs: número grande; color semántico según meta
3. Gráficos: grid tenue, labels sobre barras, alto contraste entre series (`lib/chartTheme.ts`)
4. Preferir UI sobre backend salvo petición explícita

## Archivos relacionados

- `Frontend/src/index.css`
- `Frontend/src/lib/chartTheme.ts`
- `Frontend/src/features/fed/FedCharts.tsx`
- `.cursor/rules/ui-ux.mdc`
