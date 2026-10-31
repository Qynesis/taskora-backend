// interface for completed payment
export interface PaymentCompletedInterface{
    jobId?: string;
    paymentIntentId?: string;
    chargeId?: string;
    amount: number;
    taxGstAmmount: number;
    platformFee: number;
    providerAmount: number;
    invoiceId?: string | null;
    invoiceNumber?: string | null;
    hostedInvoiceUrl?: string | null;
}
