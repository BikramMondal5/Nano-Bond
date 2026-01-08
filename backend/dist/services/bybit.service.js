"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BybitService = void 0;
const bybit_api_1 = require("bybit-api");
const config_1 = require("../config");
class BybitService {
    constructor() {
        this.client = new bybit_api_1.RestClientV5({
            key: config_1.config.bybit.key,
            secret: config_1.config.bybit.secret,
            testnet: config_1.config.bybit.testnet,
        });
    }
    /**
     * Fetches the mark price for a symbol (e.g., BTCUSDT).
     * We use this to simulate checking bond market conditions/liquidity.
     */
    async getPrice(symbol = 'ETHUSDT') {
        try {
            const response = await this.client.getTickers({
                category: 'spot',
                symbol: symbol,
            });
            if (response.retCode === 0 && response.result.list.length > 0) {
                const price = parseFloat(response.result.list[0].lastPrice);
                console.log(`[Bybit] Fetched price for ${symbol}: $${price}`);
                return price;
            }
            else {
                console.error('[Bybit] Error fetching ticker:', response.retMsg);
                return 0;
            }
        }
        catch (error) {
            console.error('[Bybit] Exception:', error);
            return 0;
        }
    }
}
exports.BybitService = BybitService;
