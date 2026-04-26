export const PaymentMethod = {
  CARD: 'CARD',
  CASH: 'CASH',
  TRANSFER: 'TRANSFER',
  OTHER: 'OTHER',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
