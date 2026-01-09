import { type PublicClient, type WalletClient, type Transport, type Chain, type Account } from 'viem'
import { BrowserProvider, JsonRpcSigner, FallbackProvider, JsonRpcProvider } from 'ethers'
import { type Config, useClient, useConnectorClient } from 'wagmi'
import * as React from 'react'

export function clientToProvider(client: PublicClient) {
    const { chain, transport } = client
    if (!chain) return undefined

    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    }
    if (transport.type === 'fallback') {
        const providers = (transport.transports as ReturnType<Transport>[]).map(
            ({ value }) => new JsonRpcProvider(value?.url, network),
        )
        if (providers.length === 1) return providers[0]
        return new FallbackProvider(providers)
    }
    return new JsonRpcProvider(transport.url, network)
}

/** Hook to convert a viem Public Client to an ethers.js Provider. */
export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
    const client = useClient<Config>({ chainId })
    return React.useMemo(() => (client ? clientToProvider(client as unknown as PublicClient) : undefined), [client])
}

export function clientToSigner(client: WalletClient) {
    const { account, chain, transport } = client
    if (!chain) return undefined

    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    }
    const provider = new BrowserProvider(transport, network)
    const signer = new JsonRpcSigner(provider, account?.address as string)
    return signer
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
    const { data: client } = useConnectorClient<Config>({ chainId })
    return React.useMemo(() => (client ? clientToSigner(client as unknown as WalletClient) : undefined), [client])
}
