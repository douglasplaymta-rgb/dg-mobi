import { NextResponse } from 'next/server';
import { db } from '@/db';
import { pixCharges, transactions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const event = await request.json();

    if (event.status === 'PAID' || event.event === 'PAYMENT_RECEIVED') {
      const externalRef = event.payment?.id;
      const paidAmountCents = event.payment?.valueCents || 150000;

      let updatedCharge;

      // 1. Tenta atualizar pelo externalReference exato
      if (externalRef) {
        const [res] = await db.update(pixCharges)
          .set({ status: 'PAID', paidAt: new Date().toISOString() })
          .where(eq(pixCharges.externalReference, externalRef))
          .returning();
        updatedCharge = res;
      }

      // 2. Fallback inteligente: se não encontrar por ID exato, apanha a última cobrança PENDENTE
      if (!updatedCharge) {
        const [pendingCharge] = await db.select()
          .from(pixCharges)
          .where(eq(pixCharges.status, 'PENDING'))
          .orderBy(desc(pixCharges.createdAt))
          .limit(1);

        if (pendingCharge) {
          const [res] = await db.update(pixCharges)
            .set({ status: 'PAID', paidAt: new Date().toISOString() })
            .where(eq(pixCharges.id, pendingCharge.id))
            .returning();
          updatedCharge = res;
        }
      }

      // 3. Se encontrou e atualizou a cobrança, injeta o valor no Caixa Diário
      if (updatedCharge) {
        const todayStr = new Date().toISOString().split('T')[0];
        
        await db.insert(transactions).values({
          txDate: todayStr,
          description: `Recebimento Pix Automático - Ref: ${updatedCharge.externalReference}`,
          category: 'Receita de Frete',
          kind: 'entrada',
          amountCents: paidAmountCents || updatedCharge.amountCents,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook Pix:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}