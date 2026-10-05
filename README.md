# 🌎 International Visitors

This application is a personal project and mainly targeted to Brazil. The language is Brazilian Portuguese. Please, use a translator and make yourself at home.

# 🛒 Shoplist - Lista de Compras & Histórico de Preços

Aplicação Web SPA (Single Page Application) moderna, offline-first (PWA), desenvolvida com código limpo e seguindo o princípio KISS (Keep It Simple, Stupid), sem dependências pesadas ou necessidade de etapas de build (`npm build`).

## 🌟 Principais Recursos

- **100% Funcional Offline**:
  - Salva todos os dados localmente no navegador (`localStorage`).
  - Service Worker (`sw.js`) e Manifesto PWA (`manifest.webmanifest`) para funcionar mesmo sem sinal de internet ou operadora dentro do supermercado.
  - Pode ser instalado na tela de início do celular como um app nativo ("Adicionar à tela inicial").
- **Idioma**: Português do Brasil (`pt-BR`) com formatação de valores em Real (`R$ 0,00`) e datas brasileiras (`DD/MM/AAAA`).
- **Acompanhamento e Histórico de Preços**:
  - Registro de preços pagos em diferentes supermercados (Assaí, Carrefour, Pão de Açúcar, Atacadão, etc.).
  - Ao definir o preço e quantidade, calcula o preço por quantidade automaticamente.
  - Exibe o preço da compra anterior logo abaixo do preço atual, com indicador de variação percentual (ex: `+15% 🔺` ou `-8% 🟢`).
  - Ao adicionar novos itens, o sistema busca automaticamente no histórico o último preço registrado daquele produto para facilitar a estimativa da compra.
- **Detecção Inteligente de Emojis em Português**:
  - Catálogo inteligente que associa nomes como "maçã" (🍎), "banana" (🍌), "arroz" (🍚), "leite" (🥛), "feijão" (🫘), "carne" (🥩) e muito mais.
  - Seletor de emojis categorizado e suporte a emojis personalizados.
- **Reordenação e Organização**:
  - Arraste e solte (*drag and drop*) para reordenar os itens da lista na ordem que desejar (ex: organizar por corredor do supermercado).
  - Botões rápidos de subir/descer (▲ / ▼) para dispositivos móveis com toque.
- **Resumo Financeiro em Tempo Real**:
  - Total gasto (soma dos itens já colocados no carrinho e marcados).
  - Total estimado da compra inteira.
  - Indicador de economia ou diferença em relação às compras passadas.
- **Backup e Restauração**:
  - Exportação e importação completa em arquivo `.json`.

## 📁 Estrutura do Projeto

```
Shoplist/
├── index.html              # Estrutura semântica SPA e modais nativos (<dialog>)
├── manifest.webmanifest    # Configuração PWA para instalação no celular
├── sw.js                   # Service Worker para cache e uso offline
├── README.md               # Documentação do projeto
├── css/
│   └── style.css           # Estilos modernos, responsivos e tema claro/escuro
├── js/
│   ├── emoji-catalog.js    # Dicionário de produtos e detecção de emojis pt-BR
│   ├── storage.js          # Camada de persistência local e histórico de preços
│   └── app.js              # Controlador SPA, eventos e regras de negócio
└── icons/
    ├── icon.svg            # Ícone vetorial do aplicativo
    └── favicon.svg         # Favicon para o navegador
```

## 🚀 Como Executar

Por ser uma aplicação SPA estática e pura (Vanilla JS ES Modules), você pode abri-la diretamente servindo a pasta com qualquer servidor web HTTP:

### Opção 1: Servidor Local

#### Python
Na pasta do projeto, execute no terminal:
```bash
python -m http.server 8080
```
E acesse no navegador: `http://localhost:8080`

#### Node
Na pasta do projeto, execute no terminal:
```bash
npx http-server
```
E acesse o endereço informado.

### Opção 2: VS Code Live Server
Se estiver usando o Visual Studio Code, clique com o botão direito em `index.html` e selecione **"Open with Live Server"**.
