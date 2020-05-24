Criado para informar e acelera o uso do SIGAA.
## Disclaimer
Este bot não é oficial.
Eu sou estudante do IFSC, onde desenvolvo este projeto em tempo livre, usando Web Scraping com nodejs e telegraf com PostgreSQL.

## Funcionalidades
<img alt="/start" src="assets/screenshot-start.jpg" width="290" /><img alt="/email" src="assets/screenshot-email.jpg" width="290" /><img alt="/agenda" src="assets/screenshot-calendar.jpg" width="290" />

### Notificações
* Em grupos ou chat privado
* Alteração em suas notas sem dizer o valor
* Notícias postadas por seus professores
* Tópico de aula
* Envio de Arquivo
* Tarefas
* Também notifica sobre questionário, vídeos, 'conteúdo'
* Envio do Plano de ensino do SIGAA em formato PDF, necessário ter o LaTeX instalado
 
### Comandos
* Busca de email e agenda de professor
`/agenda <nome do professor ou da turma>` ou `/email <nome do professor ou da turma>`
* Buscar atendimento `/atendimento`
* ver o plano de ensino `/plano`
* Ver as notas `/vernotas` 
* Forçar atualização `/atualizar`



## Para executar:
* Instalar o nodejs
* Instalar o LaTeX
* Instalar o PostgreSQL (Serve para o armazenamento do estado do bot)
* Configurar uma database no PostgreSQL
* Instalar as dependências do projeto
use `npm install` ou `yarn`
* Crie seu bot no telegram e pegue o token. veja a [Documentação do Telegram](https://core.telegram.org/bots#6-botfather).
* É necessário criar um arquivo chamado `.env` com suas credenciais do SIGAA, seu token do passo anterior e timezone do SIGAA:
```
TZ="America/Sao_Paulo"
SIGAA_USERNAME="<seu usuário>"
SIGAA_PASSWORD="<sua senha>"
BOT_TOKEN="<seu token>"
```
* Renomear o arquivo de configuração `config.example.js` para `config.js`
* Configurar o bot usando o arquivo `config.js`
* Renomear o arquivo de configuração `database.example.json` para `database.json`
* Colocar os dados de acesso do PostgreSQL no arquivo database.json
* Executar `npm run migrate` para construir a estrutura do banco de dados
* Executar o arquivo com o nodejs `npm run start` ou `yarn run start`
