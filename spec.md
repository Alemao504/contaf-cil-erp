# ContaFácil ERP

## Current State
- Partes 0, A, B, C já implementadas (v54-v55)
- ARIABubble: avatar 80x80px, expressões via emoji, animações de borda e glow
- ARIAChat: já existe como componente
- ARIAContext: já existe com mensagens, isActive, isProcessing
- Dashboard: tabela de tarefas ARIA com verde/azul/vermelho, botões Ativar
- Sidebar: reorganizada em grupos
- 10 bibliotecas em src/lib/aria-core/

## Requested Changes (Diff)

### Add
- Avatar 3x maior (240px) com animações CSS físicas reais:
  - Respiração (corpo sobe/desce)
  - Piscar dos olhos (SVG ou overlay)
  - Balanço de cabeça
  - Expressões por estado: idle, working (olhos estreitos, foco), success (sorriso largo, estrelas), error (rosto preocupado), new_file (surpresa, olhos abertos)
- Voz Web Speech API: ARIA fala em voz alta cada notificação/mensagem (pitch alto, rápido, expressivo)
- Toggle de voz no botão da bolha e nas configurações
- Comandos de voz no chat: usuário fala e ARIA processa ("abrir notas fiscais", "quem falta declaração", "processar tudo", etc.)
- Microfone no ARIAChat para ativar reconhecimento de voz

### Modify
- ARIABubble: aumentar para 240px (3x), implementar animações CSS/motion reais (não apenas emoji overlay), manter draggable e posição salva
- ARIAChat: adicionar botão de microfone, processar comandos de navegação em linguagem natural

### Remove
- Nada

## Implementation Plan
1. Atualizar ARIABubble para 240px com animações físicas (respiração, piscar, balanço) usando motion/react
2. Criar SVG chibi anime inline ou usar o avatar existente com transformações CSS animadas
3. Integrar Web Speech API (speechSynthesis) no ARIAContext - falar cada mensagem nova
4. Adicionar toggle de voz no ARIAContext e no bubble
5. Adicionar microfone no ARIAChat com SpeechRecognition API, processar comandos de navegação
6. Mapear comandos de voz para ações do app (setCurrentPage)
