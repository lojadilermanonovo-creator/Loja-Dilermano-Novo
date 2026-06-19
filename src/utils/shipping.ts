/**
 * Utility for local offline shipping calculations.
 * Allows easy reactivation of external integrations in the future.
 */

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  delivery_time: number;
  days: number; // Backward compatibility with the existing UI (.days)
  company?: string;
  description?: string;
}

/**
 * Validates a CEP (postal code) string block.
 * Returns a cleaned 8-digit CEP, or null if invalid.
 */
export function validateCEP(cep: string): string | null {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) {
    return null;
  }
  return clean;
}

/**
 * Interface representing the local/mock shipping calculator.
 * Can be customized or replaced easily in the future to redirect back to external integrations.
 */
export function calculateShippingMock(cep: string): ShippingOption[] {
  const cleanZip = validateCEP(cep);
  if (!cleanZip) {
    throw new Error('CEP inválido. Por favor, informe um CEP de 8 dígitos para o cálculo de frete.');
  }

  // Determine pricing based on prefix of the clean 8-digit CEP
  const prefix2 = cleanZip.substring(0, 2);

  let economicoPrice = 29.90;
  let expressoPrice = 39.90;

  if (['60', '61', '62', '63'].includes(prefix2)) {
    economicoPrice = 12.90;
    expressoPrice = 19.90;
  } else if (['64', '65', '66'].includes(prefix2)) {
    economicoPrice = 18.90;
    expressoPrice = 25.90;
  } else if (['67', '68', '69'].includes(prefix2)) {
    economicoPrice = 24.90;
    expressoPrice = 34.90;
  }

  return [
    {
      id: "economico",
      name: "Frete Econômico",
      price: economicoPrice,
      delivery_time: 7,
      days: 7,
      company: "Frete Econômico"
    },
    {
      id: "expresso",
      name: "Frete Expresso",
      price: expressoPrice,
      delivery_time: 3,
      days: 3,
      company: "Frete Expresso"
    },
    {
      id: "negotiated",
      name: "Frete Negociado com o Vendedor",
      price: 0,
      delivery_time: 0,
      days: 0,
      company: "Frete Negociado",
      description: "Combine o valor do frete diretamente com nossa equipe."
    }
  ];
}
