import axios from 'axios';

export interface KYCStatusResponse {
    isVerified: boolean;
    status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    kycApprovedAt?: string;
}

export const kycService = {
    /**
     * Check if a wallet is KYC verified
     */
    checkStatus: async (walletAddress: string): Promise<KYCStatusResponse> => {
        try {
            if (!walletAddress) return { isVerified: false, status: 'NOT_SUBMITTED' };

            const response = await axios.get(`/api/kyc/status/${walletAddress}`);
            return response.data;
        } catch (error) {
            console.error('Failed to check KYC status:', error);
            return { isVerified: false, status: 'NOT_SUBMITTED' };
        }
    }
};
