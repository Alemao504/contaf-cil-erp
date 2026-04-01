# ContaFácil ERP

## Current State
App contábil PWA completo com ARIA (v53). Avatar anime 2D existe mas é básico. Sem biblioteca centralizada de regras, frases, validações ou memória da ARIA.

## Requested Changes (Diff)

### Add
- `src/frontend/src/lib/aria-core/` — pasta oculta com 10 arquivos TypeScript formando o cérebro da ARIA

### Modify
- Nenhum arquivo existente alterado nesta parte

### Remove
- Nada removido

## Implementation Plan
1. Criar pasta `src/frontend/src/lib/aria-core/`
2. Criar os 10 arquivos de biblioteca:
   - aria-rules.ts — tabelas fiscais reais (IRPF 2024, Simples Nacional, INSS, FGTS)
   - aria-phrases.ts — frases por situação (saudação, processando, erro, sucesso, idle, A→Z)
   - aria-validator.ts — validações que bloqueiam ações com dados incompletos
   - aria-memory.ts — memória persistente IndexedDB, client profiling
   - aria-directives.ts — o que ARIA pode/não pode fazer, ordem de prioridade
   - aria-workflow.ts — fluxos passo a passo por processo (IRPF, NF, Folha)
   - aria-knowledge.ts — leis, normas NBC TG, legislação fiscal
   - aria-errors.ts — catálogo de erros com ação corretiva
   - aria-calendar.ts — calendário fiscal completo (vencimentos DARF, FGTS, eSocial)
   - aria-responses.ts — respostas inteligentes para o chat
3. Exportar tudo via index.ts
