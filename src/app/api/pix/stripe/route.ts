import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  
});

export async function POST(request: Request) {
  try {
    // 100 centavos = R$ 1,00 (podes testar qualquer valor)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100,
      currency: 'brl',
      payment_method_types: ['pix'],
    });

    const pixData = paymentIntent.next_action?.pix_display_qr_code;

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      qrCode: pixData?.data, // Código "Copia e Cola" do Pix
      qrCodeImageUrl: pixData?.image_url_png, // Imagem do QR Code
    });
  } catch (error: any) {
    console.error('Erro ao gerar Pix na Stripe:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}