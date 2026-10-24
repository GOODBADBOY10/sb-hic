// Usage:  node scripts/send-test-webhook.mjs <accountNumber> <amount> [reference]
// Sends the provider's sample payload to your local webhook so you can test
// the full flow without waiting for the provider.
const [accountNumber, amount = '8500', ref = crypto.randomUUID()] = process.argv.slice(2);
if (!accountNumber) {
  console.error('Usage: node scripts/send-test-webhook.mjs <accountNumber> <amount> [reference]');
  process.exit(1);
}
const headers = { 'Content-Type': 'application/json' };
if (process.env.PAYMENT_WEBHOOK_SECRET) {
  headers[process.env.PAYMENT_WEBHOOK_HEADER || 'x-webhook-secret'] = process.env.PAYMENT_WEBHOOK_SECRET;
}
const body = {
  senderBankName: 'JEF Bank',
  merchantSettledAmount: null,
  transactionReference: ref,
  amount,
  transactionDate: null,
  customerIdentifier: accountNumber,
  receiverName: 'SB HIC',
  transType: 'OTHER_BANK',
  senderName: 'TEST SENDER',
  narration: 'TEST TRANSFER',
  externalRef: 'TEST' + Date.now(),
  accountNumber,
  settledAmount: amount,
  feeCharged: null,
};
const res = await fetch(process.env.WEBHOOK_URL || 'http://localhost:3000/api/payments/webhook', {
  method: 'POST',
  headers,
  body: JSON.stringify(body),
});
console.log(res.status, await res.text());
