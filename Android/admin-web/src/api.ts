export type BackendConfig = {
  rpcUrl: string
  contracts: {
    distributorAddress: string
    bondAddress: string
    usdtAddress: string
    registryAddress: string
    gatewayAddress: string
    treasuryAddress: string
  }
}

export type Bond = {
  bondId: string
  bondName: string
  issuer: string
  adminWallet?: string
  category?: string
  contractAddress: string
  treasuryAddress?: string
  distributorAddress?: string
  couponRate: number
  minInvestment: number
  maxSubscription: number
  startDate?: string | null
  maturityDate?: string | null
  description?: string | null
  proofUrl?: string | null
  totalSupply?: string
  totalBackedValue?: string
  symbol?: string
}

const apiBase = ''

export async function getConfig(): Promise<BackendConfig> {
  const res = await fetch(`${apiBase}/api/config`)
  if (!res.ok) throw new Error(`Failed to load config (${res.status})`)
  return res.json()
}

export async function listBonds(): Promise<Bond[]> {
  const res = await fetch(`${apiBase}/api/bonds`)
  if (!res.ok) throw new Error(`Failed to list bonds (${res.status})`)
  const data = await res.json()
  return data.bonds ?? []
}

export async function createBond(payload: any): Promise<any> {
  const res = await fetch(`${apiBase}/api/admin/bonds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || `Create failed (${res.status})`)
  return data
}
