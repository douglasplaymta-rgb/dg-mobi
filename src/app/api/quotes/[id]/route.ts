import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quotes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = Number(params.id);

    // Apaga a proposta de forma real na base de dados
    await db.delete(quotes).where(eq(quotes.id, proposalId));

    return NextResponse.json({ success: true, message: 'Proposta excluída com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao excluir proposta:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}