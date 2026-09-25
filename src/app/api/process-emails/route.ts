import { NextResponse } from 'next/server';
import { processUnreadEmails } from '@/lib/services/email-parser';

export async function GET(request: Request) {
  // NOTA PARA POC: Esta rota está aberta para facilitar o teste.
  // Em produção, adicione uma verificação de token/secret aqui para que 
  // apenas o seu Cron Job ou você mesmo possa chamá-la.
  
  try {
    const result = await processUnreadEmails();
    
    if (result.success) {
      return NextResponse.json({ 
        message: 'Processamento concluído com sucesso', 
        processedCount: result.processedCount,
        data: result.data 
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao processar os e-mails' }, { status: 500 });
  }
}
