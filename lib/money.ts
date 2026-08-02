/** Mirrors the API's MoneyDto — an integer kobo count plus a preformatted display. */
export type Money = { amount_minor: number; amount_display: string };

export const zeroMoney: Money = { amount_minor: 0, amount_display: '₦0.00' };
