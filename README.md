# Lead Collector AI V2

Esta versão separa o sistema em duas partes:

- `netlify-site/` — site estático pronto para publicar no Netlify.
- `backend-render/` — API Node.js pronta para publicar no Render.
- `render.yaml` — blueprint opcional do Render.

## 1) Publicar o frontend no Netlify

A forma mais simples é usar o **Deploy manually** do Netlify e arrastar a pasta `netlify-site`.

Essa pasta já contém:
- `index.html`
- `style.css`
- `app.js`
- `_redirects`

Não há build do frontend.

## 2) Publicar o backend no Render

Opção recomendada:
1. Coloque este projeto em um repositório GitHub.
2. No Render: New > Blueprint.
3. Escolha o repositório.
4. O `render.yaml` criará o serviço Node.
5. Ao terminar, copie a URL pública, por exemplo:
   `https://lead-collector-ai-api.onrender.com`

Também é possível criar um Web Service apontando para `backend-render`,
com Build Command `npm install` e Start Command `npm start`.

## 3) Conectar o site à API

Abra o site no Netlify.
No campo **URL da API (Render)**, cole a URL pública do Render e clique em **Salvar API**.
O indicador deve mudar para **API online**.

Depois informe uma URL de um site empresarial permitido e clique em **INICIAR COLETA**.

## Segurança e finalidade

Esta versão foi projetada para pesquisa de **contatos públicos de negócios e organizações**.
O backend bloqueia domínios/categorias sensíveis e não foi feito para montar audiências publicitárias a partir de dados pessoais sensíveis.

## Exportação

O botão **Exportar CSV** gera um arquivo compatível com Excel.
