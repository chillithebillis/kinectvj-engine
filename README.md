<div align="center">
  <img src="public/favicon.svg" alt="KinectVJ Logo" width="120" height="120" />
  <h1>KinectVJ Engine 🎛️🌌</h1>
  <p><strong>Motor de Visuais e VJing Reativo a Áudio em Tempo Real (Web & Desktop)</strong></p>
</div>

<br/>

O **KinectVJ Engine** é uma ferramenta de performance visual poderosa e baseada em navegador (exportável para Windows via Electron), desenvolvida para streamers, VJs e entusiastas de música. Ele captura o áudio do seu microfone ou do sistema e gera visuais psicodélicos, minimalistas e reativos à batida (Kick/Bass) em tempo real.

![KinectVJ Engine Screenshot](https://raw.githubusercontent.com/chillithebillis/kinectvj-engine/main/src/assets/hero.png) *(Adicione uma screenshot do seu projeto na pasta src/assets com o nome hero.png)*

## ✨ Funcionalidades (Features)

*   🎚️ **Sistema Dual-Deck (A/B):** Faça mixagens suaves usando um crossfader virtual igual a equipamentos de DJ.
    *   **Deck A (Melódico/Psicodélico):** Visuais fluidos, fractais em caleidoscópio, galáxias 3D e halftones estéticos.
    *   **Deck B (Punk/Agressivo):** Estética Y2K Anime, grades de osciloscópio tridimensionais, feixes de laser e suporte a overlay de vídeo.
*   🎥 **Integração com Vídeos Locais:** Faça upload de vídeos do seu computador em tempo real para o Deck B e misture com os efeitos visuais usando Modos de Mesclagem (Screen, Dodge, Difference).
*   🎶 **Análise Avançada de Áudio:** Resposta milimétrica a frequências Kick, Bass, Mid e High para animações dinâmicas.
*   👁️ **Modo Transmissão (Sem HUD):** Aperte `H` ou `ESC` para remover toda a interface. Perfeito para captura limpa no OBS Studio, Twitch ou projetores.
*   🎞️ **Efeitos Globais (FX):** Strobe Preto e Branco na batida do kick, Rastro (Trail) anti-exposição estourada, espelhamentos de tela (Kaleida, 1/2 V, 1/2 H) e Auto-Hue.
*   🖥️ **Suporte Nativo Desktop:** Transforme o visualizador Web em um `.EXE` pronto para Windows sem necessidade de internet.

## 🚀 Como Acessar / Usar

### 🌐 Opção 1: Versão Web (Ao Vivo)
Acesse a versão hospedada rodando direto no seu navegador de qualquer lugar:
👉 **[kinectvj-engine.vercel.app](https://kinectvj-engine.vercel.app)** *(Confirme o link gerado pelo seu Vercel)*

1. Clique em **"Capturar Stream"** (para ouvir o áudio do PC/Navegador) ou **"Microfone Local"**.
2. Brinque com o Crossfader e os Botões.

### 💻 Opção 2: Instalador Windows (.EXE)
Baixe a versão nativa completa na aba **Releases** deste GitHub.
1. Baixe o arquivo `KinectVJ-Windows-Portable.zip`.
2. Extraia e execute `KinectVJ Component.exe`.

---

## 🛠️ Para Desenvolvedores

Se você quer baixar o código-fonte, modificar as cores ou criar novas cenas visuais (no arquivo `src/main.ts`):

### Instalação Física (Local)
```bash
# Clone o repositório
git clone https://github.com/chillithebillis/kinectvj-engine.git

# Entre na pasta
cd kinectvj-engine

# Instale as dependências
npm install

# Inicie o servidor de testes (Irá abrir no seu navegador local)
npm run dev
```

### Criando o arquivo .EXE para Windows
O projeto já está configurado com o construtor `electron-builder`. Para fabricar um `.exe` na sua máquina:
```bash
# Rode a construção
npm run electron:build
```
O executável final e os arquivos nativos aparecerão dentro da pasta `/release`.

## 🎮 Controles de Teclado (Atalhos)
*   **1 a 5:** Troca cenas do DECK A.
*   **6 a 0:** Troca cenas do DECK B.
*   **Scroll do Mouse:** Move o Crossfader (A <-> B)
*   **Click + Drag (Tela):** Efeito de Dobra Espacial (Warp) onde o mouse estiver.
*   **H ou ESC:** Esconde o Painel de VJ e Interface.

---

<div align="center">
  <p>Feito com ⚡ Vite, TypeScript e Canvas API.</p>
</div>
