import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// Idealmente, para inserção backend, usamos a SERVICE_ROLE_KEY se disponível, 
// mas para a POC a ANON_KEY serve desde que as políticas de RLS permitam INSERT.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

export async function processUnreadEmails() {
  console.log('Iniciando conexão IMAP com o Gmail...');
  
  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    secure: true,
    auth: {
      user: process.env.IMAP_USER || '',
      pass: process.env.IMAP_PASSWORD || ''
    },
    logger: false,
    tls: {
      rejectUnauthorized: false
    }
  });

  const results: any[] = [];

  try {
    console.log(`Conectando com usuário: ${process.env.IMAP_USER}`);
    await client.connect();
    console.log('Conectado ao IMAP com sucesso!');
    
    // Tentar abrir a caixa de entrada sem Lock bloqueante
    console.log('Abrindo a caixa de entrada (INBOX)...');
    await client.mailboxOpen('INBOX');
    console.log('INBOX aberta com sucesso!');
    
    try {
      // Buscar mensagens não lidas enviadas exclusivamente pelo Claudemir
      console.log('Iniciando busca por mensagens não lidas enviadas por Claudemir...');
      
      const messages = await client.fetch(
        { seen: false, from: 'claudemir.nogueira@ccargo.com.br' }, 
        { source: true, uid: true }
      );
      
      let messageCount = 0;
      const uidsToMarkAsRead: number[] = [];
      
      for await (const message of messages) {
        messageCount++;
        console.log(`Fazendo parse do e-mail UID: ${message.uid}`);
        
        const parsed = await simpleParser(message.source);
        const htmlContent = parsed.html || parsed.textAsHtml || '';
        const $ = cheerio.load(htmlContent);
        
        // Procura todas as linhas de tabela no HTML do e-mail
        const rows = $('table tr');
        let tableHasCorrectColumns = false;

        // Verificar se a tabela tem as colunas exatas
        rows.each((i, row) => {
          const cols = $(row).find('td, th');
          if (cols.length >= 5) {
            const c0 = $(cols[0]).text().trim().toUpperCase();
            const c1 = $(cols[1]).text().trim().toUpperCase();
            const c2 = $(cols[2]).text().trim().toUpperCase();
            const c3 = $(cols[3]).text().trim().toUpperCase();
            const c4 = $(cols[4]).text().trim().toUpperCase();

            // Se for a linha de cabeçalho com os nomes corretos
            if (c0 === 'NF' && c1 === 'DESTINATÁRIO' && c2 === 'STATUS' && c3 === 'CHEGADA' && c4 === 'SAIDA') {
              tableHasCorrectColumns = true;
            }
          }
        });

        if (tableHasCorrectColumns) {
          console.log(`Tabela válida encontrada no e-mail UID: ${message.uid}`);
          // Extrair os dados da tabela
          rows.each((i, row) => {
            const cols = $(row).find('td, th');
            
            if (cols.length >= 5) {
              const nf = $(cols[0]).text().trim();
              const destinatario = $(cols[1]).text().trim();
              const status = $(cols[2]).text().trim();
              const chegada = $(cols[3]).text().trim();
              const saida = $(cols[4]).text().trim();

              // Ignorar a própria linha de cabeçalho e validar o STATUS exigido para a POC
              if (nf.toUpperCase() !== 'NF' && destinatario.toUpperCase() !== 'DESTINATÁRIO') {
                if (status.toUpperCase().includes('ENTREGUE')) {
                  results.push({
                    nf,
                    destinatario,
                    status,
                    chegada,
                    saida,
                    email_date: parsed.date,
                    email_subject: parsed.subject || 'Sem Assunto'
                  });
                } else {
                  console.log(`Linha ignorada: Status é '${status}', não é 'ENTREGUE'.`);
                }
              }
            }
          });
          
          // Adicionamos na lista para marcar como lido depois
          uidsToMarkAsRead.push(message.uid);
        } else {
          console.log(`E-mail UID ${message.uid} ignorado (não contém as colunas necessárias).`);
        }
      }
      
      // Marcar todos os processados como lido DEPOIS que a stream de fetch terminar
      if (uidsToMarkAsRead.length > 0) {
        console.log(`Marcando ${uidsToMarkAsRead.length} e-mails como lidos...`);
        // Na imapflow, podemos passar um array de UIDs ou uma string separada por vírgula
        await client.messageFlagsAdd(uidsToMarkAsRead.join(','), ['\\Seen'], { uid: true });
        console.log('E-mails marcados como lidos.');
      }

    } finally {
      // Fechar a caixa
      await client.mailboxClose();
    }

    
    await client.logout();

    // Salvar no Supabase usando UPSERT para atualizar NFs existentes
    if (results.length > 0) {
      const { error } = await supabase
        .from('email_delivery_reports')
        .upsert(results, { onConflict: 'nf' });
        
      if (error) {
        console.error('Erro ao inserir no Supabase:', error);
        throw error;
      }
    }

    return { success: true, processedCount: results.length, data: results };
  } catch (error) {
    console.error('Erro no processamento IMAP:', error);
    return { success: false, error: (error as Error).message };
  }
}
