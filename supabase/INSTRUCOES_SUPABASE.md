# Instruções para Execução do Banco de Dados no Supabase

Para ativar o banco de dados do projeto **CCargo** no Supabase, siga este passo a passo rápido:

### 1. Acessar o SQL Editor no Supabase
1. Abra o painel do seu projeto no Supabase: [https://supabase.com/dashboard/project/njoftudcqaoscyftwyhf](https://supabase.com/dashboard/project/njoftudcqaoscyftwyhf)
2. No menu lateral esquerdo, clique no ícone **SQL Editor**.
3. Clique em **+ New query**.

### 2. Executar o Script
1. Abra o arquivo local [`supabase/schema.sql`](file:///c:/Users/wilkinson/Desktop/Amazing%20Flow/CCargo/supabase/schema.sql) deste projeto.
2. Copie todo o conteúdo do arquivo.
3. Cole no editor do Supabase e clique no botão verde **Run** (ou pressione `Ctrl + Enter`).

### 3. O que o script cria:
- **`tenants`**: Empresa principal (CCARGO TRANSPORTES E LOGISTICA).
- **`branches`**: As 4 Filiais (Matriz SP, Curitiba PR, Rio de Janeiro RJ e Belo Horizonte MG).
- **`customers`**: Embarcadores exemplo (Ambev, Magazine Luiza, Natura).
- **`contract_slas`**: Parametrização individual de tempo livre (ex: 2h Ambev, 3h Magalu, 5h Natura) e valor por hora excedente.
- **`cargo_legs`**: Cargas ativas em tempo real com horários de chegada (check-in) e dados de CT-e.
- **`leg_events`**: Histórico de ocorrências (Chegada no cliente, início de descarga, entrega realizada).
- **`detention_bills`**: Faturas de estadias já calculadas.
- **Índices otimizados**: Consultas rápidas por placa, CT-e e status.
