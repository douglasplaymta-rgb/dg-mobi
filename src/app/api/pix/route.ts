import { NextResponse } from 'next/server';
import { db } from '@/db';
import { pixCharges } from '@/db/schema';
import QRCode from 'qrcode';

// Função para calcular o CRC16 padrão do Banco Central (Pix EMV)
function getCRC16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

// Gerador do Payload Pix Oficial Otimizado (Compatível com Inter, Nubank e todos os bancos)
function generatePixPayload({
  key,
  name,
  city,
  amount,
  txid,
}: {
  key: string;
  name: string;
  city: string;
  amount: string;
  txid: string;
}): string {
  // Payload Indicator
  const payloadIndicator = formatField('00', '01');

  // Merchant Account Information (GUI + Chave Pix limpa)
  const gui = formatField('00', 'br.gov.bcb.pix');
  const pixKey = formatField('01', key);
  const merchantAccountInfo = formatField('26', gui + pixKey);

  // MCC (Default 0000)
  const mcc = formatField('52', '0000');

  // Transaction Currency (986 = BRL)
  const currency = formatField('53', '986');

  // Transaction Amount
  const amt = formatField('54', amount);

  // Country Code
  const country = formatField('58', 'BR');

  // Merchant Name (Max 25 chars, sem acentos ou caracteres especiais extremos)
  const merchantName = formatField('59', name.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

  // Merchant City (Max 15 chars)
  const merchantCity = formatField('60', city.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

  // Additional Data Field Template (TXID)
  const txIdField = formatField('05', txid || '***');
  const additionalData = formatField('62', txIdField);

  const payloadWithoutCrc = 
    payloadIndicator +
    merchantAccountInfo +
    mcc +
    currency +
    amt +
    country +
    merchantName +
    merchantCity +
    additionalData +
    '6304';
    
  const crc = getCRC16(payloadWithoutCrc);
  return payloadWithoutCrc + crc;
}

export async function POST(request: Request) {
  try {
    const { quoteId, amountCents, customerDocument } = await request.json();

    const amountStr = (amountCents / 100).toFixed(2);
    const txid = `DGMOBI${quoteId}`;

    // Chave Pix Real: CNPJ limpo apenas com números (exigência dos validadores bancários como o Banco Inter)
    const cleanCnpj = '67836840000160'; 
    const merchantName = 'DG MOBI';
    const merchantCity = 'FORTALEZA';

    // Gerar o Código Pix Copia e Cola Corrigido
    const pixCopyPaste = generatePixPayload({
      key: cleanCnpj,
      name: merchantName,
      city: merchantCity,
      amount: amountStr,
      txid: txid,
    });

    // Gerar a Imagem Base64 do QR Code
    const qrCodeBase64 = await QRCode.toDataURL(pixCopyPaste, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 2,
      width: 300,
    });

    const pixData = {
      externalReference: txid,
      qrCode: pixCopyPaste,
      qrCodeBase64: qrCodeBase64,
    };

    // Registar a cobrança no banco de dados para o Caixa Diário
    await db.insert(pixCharges).values({
      quoteId: quoteId,
      externalReference: pixData.externalReference,
      amountCents: amountCents,
      qrCode: pixData.qrCode,
      qrCodeBase64: pixData.qrCodeBase64,
      status: 'PENDING',
      payerDocument: customerDocument || '00000000000',
    });

    return NextResponse.json({
      success: true,
      pix: pixData,
    });
  } catch (error) {
    console.error('Erro ao gerar Pix real:', error);
    return NextResponse.json({ success: false, error: 'Erro ao gerar Pix' }, { status: 500 });
  }
}