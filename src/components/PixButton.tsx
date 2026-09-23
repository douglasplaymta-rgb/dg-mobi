'use client';

import { useState } from 'react';

interface PixButtonProps {
  quoteId: number;
  amountCents: number;
  clientDocument?: string | null;
}

export function PixButton({ quoteId, amountCents, clientDocument }: PixButtonProps) {
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleGeneratePix = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          amountCents,
          customerDocument: clientDocument || '00000000000',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPixData(data.pix);
      } else {
        alert('Erro ao gerar cobrança Pix.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão ao gerar Pix.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div>
      {!pixData ? (
        <button
          onClick={handleGeneratePix}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
        >
          {loading ? 'A gerar Pix...' : 'Gerar Pix de Pagamento'}
        </button>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mt-4 text-zinc-100 max-w-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm text-emerald-400">Pix Gerado com Sucesso</h3>
            <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">
              {formatCurrency(amountCents)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg flex justify-center mb-4">
            {pixData.qrCodeBase64 ? (
              <img
                src={pixData.qrCodeBase64.startsWith('data:image') ? pixData.qrCodeBase64 : `data:image/png;base64,${pixData.qrCodeBase64}`}
                alt="QR Code Pix"
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="text-zinc-900 text-xs font-mono text-center py-10">
                [ QR Code indisponível ]
              </div>
            )}
          </div>

          <button
            onClick={handleCopyCode}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg text-xs transition-colors"
          >
            {copied ? 'Código Copiado com Sucesso!' : 'Copiar Código Pix'}
          </button>
        </div>
      )}
    </div>
  );
}