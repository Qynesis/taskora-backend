export interface IndividualOnboardingData {
    userId: string;
    providerId: string;
    tosIpAddress: string;
    bankAccountToken: string;

    individual: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        dob: { day: number; month: number; year: number };
        address: { line1: string; city: string; state: string; postal_code: string; country: 'AU' };
        idNumber?: string | null;
        identityDocumentFrontUrl?: string | null;
        identityDocumentBackUrl?: string | null;
    };

    businessProfile: {
        mcc?: string | null;
    };

    bankDetails: {
        accountNumber: string;
        bsbNumber: string;
        accountHolderName: string;
    };
}

export interface MakePaymentIntent{
    jobId: string;
    amount: number;
    customer: string;
    paymentMethod: string;
    providerAccountId: string;
    applicationFeeAmount: number;
    taxGstAmmount: number;
    futureUsage: boolean;
    seekerUserId: string;
    providerUserId: string;
}
