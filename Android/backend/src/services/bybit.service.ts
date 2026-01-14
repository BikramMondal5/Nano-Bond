import { RestClientV5 } from 'bybit-api';
import { config } from '../config';

export class BybitService {
    private client: RestClientV5;

    constructor() {
        this.client = new RestClientV5({
            key: config.bybit.key,
            secret: config.bybit.secret,
            testnet: config.bybit.testnet,
        });
    }

    /**
     * Fetches the mark price for a symbol (e.g., BTCUSDT).
     * We use this to simulate checking bond market conditions/liquidity.
     */
    async getPrice(symbol: string = 'ETHUSDT'): Promise<number> {
        try {
            const response = await this.client.getTickers({
                category: 'spot',
                symbol: symbol,
            });

            if (response.retCode === 0 && response.result.list.length > 0) {
                const price = parseFloat(response.result.list[0].lastPrice);
                console.log(`[Bybit] Fetched price for ${symbol}: $${price}`);
                return price;
            } else {
                console.error('[Bybit] Error fetching ticker:', response.retMsg);
                return 0;
            }
        } catch (error) {
            console.error('[Bybit] Exception:', error);
            return 0;
        }
    }
}
