# Figma — GeoRisco Santo André (Web)

## Arquivo principal

**Componentes Web - G04**
<https://www.figma.com/design/CzN7zq07wiUcLSSrRf1zj8/Componentes-Web---G04>

## Páginas do arquivo

| Página | Conteúdo |
|---|---|
| Componentes Web | Biblioteca de componentes reutilizáveis (badges, KPI, tabela, filtro, navbar, botão de exportação) |
| Login | Tela de login — 3 estados: Normal, Erro, Loading |
| Visualização | Dashboard principal — KPIs, placeholder do mapa, tabela de últimos cadastros |
| Mapa Georreferenciado | Mapa em tela cheia — clustering, popover de cadastro, painel de filtros flutuante |
| Completude | Acompanhamento de completude — abas, barras de progresso, indicadores de status, aviso LGPD |
| Lista de Cadastros | Lista paginada de famílias — filtros, busca, ação "Ver no Mapa" |
| **Fluxo Web Navegável** | **Protótipo navegável** — cópias de todas as telas com reações de navegação conectadas |

## Protótipo navegável

A página **"Fluxo Web Navegável"** contém o fluxo completo com as seguintes conexões:

```
Login  ──[Entrar]──►  Visualização
                           │
                    [Nav Famílias / Ver todos / Action/Ver]
                           │
                           ▼
                    Lista de Cadastros
                           │
               [MapBtn / Nav Mapa de Risco]
                           │
                           ▼
                    Mapa Georreferenciado
                           │
                    [Button/VerCadastro]
                           │
                           ▼
                    Lista de Cadastros

Visualização  ──[Nav Relatórios]──►  Completude
Completude    ──[Nav Dashboard]──►   Visualização
Lista         ──[Nav Completude]──►  Completude
Completude    ──[Button/Completar]── Lista de Cadastros
```

Para apresentar o protótipo: abra a página "Fluxo Web Navegável", selecione o frame **Login/Screen** e clique em ▶ (Present) no canto superior direito do Figma.

## Prints

Os prints das telas estão em `assets/prints/`:

| Arquivo | Tela |
|---|---|
| `login.png` | Tela de login (estado normal) |
| `tela-visualizacao.png` | Dashboard / Visualização |
| `mapa-georreferenciado.png` | Mapa em tela cheia |
| `completude.png` | Acompanhamento de Completude |
| `fluxo-web-navegavel.png` | Visão geral do fluxo conectado |
