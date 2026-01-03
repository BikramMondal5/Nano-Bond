import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mantleSepoliaTestnet } from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'GovtBond',
    projectId: 'YOUR_PROJECT_ID', // TODO: Get from user or use placeholder
    chains: [mantleSepoliaTestnet],
    ssr: true, // If your dApp uses server side rendering (SSR)
});
