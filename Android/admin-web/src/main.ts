import './style.css'
import { BrowserProvider, Contract, ethers } from 'ethers'
import { getConfig, listBonds, createBond, type Bond, type BackendConfig } from './api'
import { bondAbi, distributorAbi, erc20Abi, treasuryAbi } from './abi'

type ToastType = 'good' | 'bad'

function toast(title: string, msg: string, type: ToastType = 'good') {
  const existing = document.getElementById('toast')
  if (existing) existing.remove()

  const el = document.createElement('div')
  el.id = 'toast'
  el.className = `toast ${type}`
  el.innerHTML = `<div class="title">${escapeHtml(title)}</div><div class="msg">${escapeHtml(msg)}</div>`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 6500)
}

function escapeHtml(str: string) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function short(addr?: string) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function getHashBondId() {
  const url = new URL(window.location.href)
  const id = url.hash.startsWith('#bond=') ? url.hash.replace('#bond=', '') : ''
  return decodeURIComponent(id)
}

let backendConfig: BackendConfig | null = null
let provider: BrowserProvider | null = null
let signer: ethers.Signer | null = null
let connectedAddress: string | null = null

async function getGasOptions(provider: BrowserProvider) {
  try {
    const feeData = await provider.getFeeData()
    console.log('Fee Data:', feeData)
    // Increase maxFeePerGas by 300% (3x) to be safe against base fee fluctuations
    if (feeData.maxFeePerGas) {
      const buffered = (feeData.maxFeePerGas * 300n) / 100n
      return {
        maxFeePerGas: buffered,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      }
    }
  } catch (e) {
    console.warn('Failed to fetch gas fees', e)
  }
  return {}
}

async function connectWallet() {
  const eth = (window as any).ethereum
  if (!eth) throw new Error('MetaMask not found')
  await eth.request({ method: 'eth_requestAccounts' })
  provider = new BrowserProvider(eth)
  signer = await provider.getSigner()
  connectedAddress = await signer.getAddress()
}

async function ensureConnected() {
  if (!signer || !connectedAddress) {
    await connectWallet()
  }
}

async function refresh() {
  if (!backendConfig) backendConfig = await getConfig()

  const bonds = await listBonds()
  const selectedBondId = getHashBondId()
  render(bonds, selectedBondId)
}

function render(bonds: Bond[], selectedBondId: string) {
  const app = document.getElementById('app')!

  const selected = selectedBondId ? bonds.find(b => b.bondId === selectedBondId) : null

  app.innerHTML = `
    <div class="container">
      <div class="header">
        <div class="brand">
          <h1>NanoBond Admin</h1>
          <span class="badge">MetaMask + Admin Actions</span>
        </div>
        <div class="row">
          <span class="badge" id="walletBadge">${connectedAddress ? `Wallet: ${short(connectedAddress)}` : 'Wallet: not connected'}</span>
          <button class="primary" id="connectBtn">${connectedAddress ? 'Reconnect' : 'Connect MetaMask'}</button>
        </div>
      </div>

      <div class="grid two">
        <div class="card">
          <h2>Create Bond (Registry + optional Auto-Deploy)</h2>
          <div class="row">
            <div class="field">
              <label>Bond Name</label>
              <input id="bondName" placeholder="e.g. Highway Infra 2029" />
            </div>
            <div class="field">
              <label>Bond ID</label>
              <input id="bondId" placeholder="e.g. HWY-2029" />
            </div>
          </div>
          <div class="row">
            <div class="field">
              <label>Issuer</label>
              <input id="issuer" placeholder="e.g. NHAI" />
            </div>
            <div class="field">
              <label>Coupon Rate (%)</label>
              <input id="couponRate" type="number" step="0.1" placeholder="7.5" />
            </div>
          </div>
          <div class="row">
            <div class="field">
              <label>Min Investment (USDT)</label>
              <input id="minInvestment" type="number" step="1" placeholder="100" />
            </div>
            <div class="field">
              <label>Max Subscription (USDT)</label>
              <input id="maxSubscription" type="number" step="1" placeholder="1000000" />
            </div>
          </div>
          <div class="row">
            <div class="field">
              <label>Start Date</label>
              <input id="startDate" type="date" />
            </div>
            <div class="field">
              <label>Maturity Date</label>
              <input id="maturityDate" type="date" />
            </div>
          </div>
          <div class="row">
            <div class="field">
              <label>Contract Address (manual only)</label>
              <input id="contractAddress" class="mono" placeholder="0x..." />
            </div>
          </div>
          <div class="row">
            <div class="field">
              <label><input id="autoDeploy" type="checkbox" /> Auto-Deploy Bond + Treasury + Distributor</label>
              <div class="notice">Auto-deploy uses backend PRIVATE_KEY to deploy contracts, but grants admin rights to your connected wallet.</div>
            </div>
          </div>
          <div class="row">
            <button class="primary" id="createBondBtn">Create Bond</button>
            <button id="reloadBtn">Reload List</button>
          </div>
        </div>

        <div class="card">
          <h2>Bonds</h2>
          <div class="notice">Select a bond to manage it. Actions require the bond admin wallet to match your MetaMask address.</div>
          <table class="table" id="bondsTable">
            <thead>
              <tr>
                <th>Bond</th>
                <th>Issuer</th>
                <th>Admin</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${bonds
      .map(
        b => `
                <tr>
                  <td>${escapeHtml(b.bondName)}<div class="notice">${escapeHtml(b.bondId)}</div></td>
                  <td>${escapeHtml(b.issuer)}</td>
                  <td class="mono">${b.adminWallet ? short(b.adminWallet) : '-'}</td>
                  <td><button data-bond="${escapeHtml(b.bondId)}">Manage</button></td>
                </tr>`
      )
      .join('')}
            </tbody>
          </table>
        </div>
      </div>

      ${selected ? renderManageSection(selected) : ''}

      <div class="card" style="margin-top: 14px">
        <h2>Backend Config</h2>
        <div class="kv">
          <div>RPC</div><div class="mono">${escapeHtml(backendConfig?.rpcUrl || '')}</div>
          <div>USDT</div><div class="mono">${escapeHtml(backendConfig?.contracts?.usdtAddress || '')}</div>
          <div>Registry</div><div class="mono">${escapeHtml(backendConfig?.contracts?.registryAddress || '')}</div>
        </div>
        <div class="notice" style="margin-top: 10px">If these are empty, configure Android/backend environment variables.</div>
      </div>
    </div>
  `

    ; (document.getElementById('connectBtn') as HTMLButtonElement).onclick = async () => {
      try {
        await connectWallet()
        toast('Wallet connected', connectedAddress || '')
        await refresh()
      } catch (e: any) {
        toast('Connect failed', e?.message || String(e), 'bad')
      }
    }

    ; (document.getElementById('reloadBtn') as HTMLButtonElement).onclick = async () => {
      try {
        await refresh()
      } catch (e: any) {
        toast('Reload failed', e?.message || String(e), 'bad')
      }
    }

    ; (document.getElementById('createBondBtn') as HTMLButtonElement).onclick = async () => {
      try {
        await ensureConnected()

        const payload: any = {
          bondName: (document.getElementById('bondName') as HTMLInputElement).value.trim(),
          bondId: (document.getElementById('bondId') as HTMLInputElement).value.trim(),
          issuer: (document.getElementById('issuer') as HTMLInputElement).value.trim(),
          couponRate: (document.getElementById('couponRate') as HTMLInputElement).value,
          minInvestment: (document.getElementById('minInvestment') as HTMLInputElement).value,
          maxSubscription: (document.getElementById('maxSubscription') as HTMLInputElement).value,
          startDate: (document.getElementById('startDate') as HTMLInputElement).value,
          maturityDate: (document.getElementById('maturityDate') as HTMLInputElement).value,
          contractAddress: (document.getElementById('contractAddress') as HTMLInputElement).value.trim(),
          autoDeploy: (document.getElementById('autoDeploy') as HTMLInputElement).checked,
          adminWallet: connectedAddress,
        }

        const result = await createBond(payload)
        toast('Bond created', `Bond ${result?.bond?.bondId || ''} added`)
        await refresh()
      } catch (e: any) {
        toast('Create failed', e?.message || String(e), 'bad')
      }
    }

  document.querySelectorAll<HTMLButtonElement>('#bondsTable button[data-bond]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-bond') || ''
      window.location.hash = `bond=${encodeURIComponent(id)}`
    }
  })

  wireManageActions(selected ?? null)
}

function renderManageSection(bond: Bond) {
  const isOwner = connectedAddress && bond.adminWallet
    ? connectedAddress.toLowerCase() === bond.adminWallet.toLowerCase()
    : true

  const disabledAttr = isOwner ? '' : 'disabled'

  return `
    <div class="card" style="margin-top: 14px">
      <h2>Manage Bond: ${escapeHtml(bond.bondName)} (${escapeHtml(bond.bondId)})</h2>
      <div class="notice">Ownership: ${bond.adminWallet ? escapeHtml(bond.adminWallet) : 'not set'} ${isOwner ? '' : '(not your wallet)'} </div>

      <div class="kv" style="margin-top: 10px">
        <div>Bond</div><div class="mono">${escapeHtml(bond.contractAddress || '')}</div>
        <div>Treasury</div><div class="mono">${escapeHtml(bond.treasuryAddress || '')}</div>
        <div>Distributor</div><div class="mono">${escapeHtml(bond.distributorAddress || '')}</div>
      </div>

      <div class="grid two" style="margin-top: 14px">
        <div class="card">
          <h2>Proof / Backing (on-chain)</h2>
          <div class="row">
            <div class="field">
              <label>Proof URI / IPFS hash</label>
              <input id="proofUri" class="mono" placeholder="ipfs://... or 0x..." />
            </div>
            <div class="field">
              <label>Asset Value (18 decimals, enter like 100000)</label>
              <input id="assetValue" type="number" placeholder="100000" />
            </div>
          </div>
          <div class="row">
            <button class="primary" id="addAssetBtn" ${disabledAttr}>Add Asset</button>
          </div>
          <div class="notice">Adds to totalBackedValue (minting cap).</div>
        </div>

        <div class="card">
          <h2>Maturity</h2>
          <div class="row">
            <div class="field">
              <label>Set Maturity Date</label>
              <input id="maturitySet" type="datetime-local" />
            </div>
          </div>
          <div class="row">
            <button class="primary" id="setMaturityBtn" ${disabledAttr}>Set Maturity</button>
            <button id="refreshStatsBtn">Refresh Stats</button>
          </div>
          <div class="notice">Unlocking is based on on-chain maturity timestamp.</div>
        </div>

        <div class="card">
          <h2>Distributor (Yield)</h2>
          <div class="row">
            <div class="field">
              <label>USDT Approve Amount</label>
              <input id="approveAmount" type="number" placeholder="1000" />
            </div>
            <div class="field">
              <label>Fund Reserve (USDT)</label>
              <input id="fundAmount" type="number" placeholder="100" />
            </div>
          </div>
          <div class="row">
            <button id="approveBtn" ${disabledAttr}>Approve USDT</button>
            <button class="primary" id="fundReserveBtn" ${disabledAttr}>Fund Reserve</button>
          </div>

          <div class="row" style="margin-top: 10px">
            <div class="field">
              <label>Distribute Yield (amount USDT)</label>
              <input id="yieldAmount" type="number" placeholder="50" />
            </div>
            <div class="field">
              <label>Distribute Rate (USDT per 1 Bond)</label>
              <input id="rateAmount" type="number" placeholder="0.05" />
            </div>
          </div>
          <div class="row">
            <button class="primary" id="depositYieldBtn" ${disabledAttr}>Deposit Yield</button>
            <button class="primary" id="distributeRateBtn" ${disabledAttr}>Distribute Rate</button>
          </div>
        </div>

        <div class="card">
          <h2>Treasury</h2>
          <div class="row">
            <div class="field">
              <label>Deposit to Treasury (USDT)</label>
              <input id="treasuryDeposit" type="number" placeholder="100" />
            </div>
            <div class="field">
              <label>Withdraw from Treasury (USDT)</label>
              <input id="treasuryWithdraw" type="number" placeholder="50" />
            </div>
          </div>
          <div class="row">
            <button id="treasuryDepositBtn">Deposit (USDT.transfer)</button>
            <button class="primary" id="treasuryWithdrawBtn" ${disabledAttr}>Withdraw Reserves</button>
          </div>
          <div class="notice">Withdraw requires treasury DEFAULT_ADMIN_ROLE, usually given to bond admin wallet on deployment.</div>
        </div>
      </div>

      <div class="card" style="margin-top: 14px">
        <h2>Stats (on-chain)</h2>
        <div class="kv" id="statsKv">
          <div>Total Supply</div><div class="mono">-</div>
          <div>Total Backed</div><div class="mono">-</div>
          <div>Maturity (unix)</div><div class="mono">-</div>
          <div>Distributor Balance (USDT)</div><div class="mono">-</div>
          <div>Cumulative Yield/Token</div><div class="mono">-</div>
        </div>
      </div>
    </div>
  `
}

function wireManageActions(bond: Bond | null) {
  if (!bond) return

  const refreshStats = async () => {
    try {
      if (!backendConfig) backendConfig = await getConfig()
      if (!provider) {
        const eth = (window as any).ethereum
        if (eth) provider = new BrowserProvider(eth)
      }

      if (!provider) throw new Error('No provider')
      const readProvider = provider

      const usdtAddr = backendConfig.contracts.usdtAddress
      if (!usdtAddr) throw new Error('USDT_ADDRESS missing in backend config')

      const bondC = new Contract(bond.contractAddress, bondAbi, readProvider)
      const supply = await bondC.totalSupply()
      const backed = await bondC.totalBackedValue()
      const maturity = await bondC.maturityDate()

      let distBal = '0'
      let cum = '0'

      if (bond.distributorAddress) {
        const usdt = new Contract(usdtAddr, erc20Abi, readProvider)
        const distributor = new Contract(bond.distributorAddress, distributorAbi, readProvider)
        const [bal, cy] = await Promise.all([
          usdt.balanceOf(bond.distributorAddress),
          distributor.cumulativeYieldPerToken(),
        ])
        distBal = ethers.formatUnits(bal, 6)
        cum = ethers.formatUnits(cy, 18)
      }

      const kv = document.getElementById('statsKv')
      if (kv) {
        kv.innerHTML = `
          <div>Total Supply</div><div class="mono">${ethers.formatUnits(supply, 18)}</div>
          <div>Total Backed</div><div class="mono">${ethers.formatUnits(backed, 18)}</div>
          <div>Maturity (unix)</div><div class="mono">${maturity.toString()}</div>
          <div>Distributor Balance (USDT)</div><div class="mono">${escapeHtml(distBal)}</div>
          <div>Cumulative Yield/Token</div><div class="mono">${escapeHtml(cum)}</div>
        `
      }
    } catch (e: any) {
      toast('Stats failed', e?.message || String(e), 'bad')
    }
  }

  const refreshBtn = document.getElementById('refreshStatsBtn') as HTMLButtonElement | null
  if (refreshBtn) refreshBtn.onclick = refreshStats

  // Proof
  const addAssetBtn = document.getElementById('addAssetBtn') as HTMLButtonElement | null
  if (addAssetBtn) {
    addAssetBtn.onclick = async () => {
      try {
        await ensureConnected()
        const uri = (document.getElementById('proofUri') as HTMLInputElement).value.trim()
        const val = (document.getElementById('assetValue') as HTMLInputElement).value
        if (!uri || !val) throw new Error('Missing URI or value')

        const c = new Contract(bond.contractAddress, bondAbi, signer!)
        const gasOpts = await getGasOptions(provider!)
        const tx = await c.addAsset(uri, ethers.parseUnits(val, 18), gasOpts)
        toast('TX sent', tx.hash)
        await tx.wait()
        toast('Asset added', 'Confirmed on-chain')
        await refreshStats()
      } catch (e: any) {
        toast('Add asset failed', e?.message || String(e), 'bad')
      }
    }
  }

  // Maturity
  const setMaturityBtn = document.getElementById('setMaturityBtn') as HTMLButtonElement | null
  if (setMaturityBtn) {
    setMaturityBtn.onclick = async () => {
      try {
        await ensureConnected()
        const dt = (document.getElementById('maturitySet') as HTMLInputElement).value
        if (!dt) throw new Error('Pick a datetime')
        const ts = Math.floor(new Date(dt).getTime() / 1000)

        const c = new Contract(bond.contractAddress, bondAbi, signer!)
        const gasOpts = await getGasOptions(provider!)
        const tx = await c.setMaturityDate(BigInt(ts), gasOpts)
        toast('TX sent', tx.hash)
        await tx.wait()
        toast('Maturity updated', `New maturity unix: ${ts}`)
        await refreshStats()
      } catch (e: any) {
        toast('Set maturity failed', e?.message || String(e), 'bad')
      }
    }
  }

  // Distributor actions
  const approveBtn = document.getElementById('approveBtn') as HTMLButtonElement | null
  const fundReserveBtn = document.getElementById('fundReserveBtn') as HTMLButtonElement | null
  const depositYieldBtn = document.getElementById('depositYieldBtn') as HTMLButtonElement | null
  const distributeRateBtn = document.getElementById('distributeRateBtn') as HTMLButtonElement | null

  const requireDistributor = () => {
    if (!bond.distributorAddress) throw new Error('No distributorAddress set for this bond')
    if (!backendConfig?.contracts?.usdtAddress) throw new Error('USDT_ADDRESS missing in backend config')
  }

  if (approveBtn) {
    approveBtn.onclick = async () => {
      try {
        await ensureConnected()
        requireDistributor()
        const amt = (document.getElementById('approveAmount') as HTMLInputElement).value
        if (!amt) throw new Error('Enter amount')

        const usdt = new Contract(backendConfig!.contracts.usdtAddress, erc20Abi, signer!)
        const gasOpts = await getGasOptions(provider!)
        const tx = await usdt.approve(bond.distributorAddress, ethers.parseUnits(amt, 6), gasOpts)
        toast('Approve sent', tx.hash)
        await tx.wait()
        toast('Approved', 'USDT approved to distributor')
      } catch (e: any) {
        toast('Approve failed', e?.message || String(e), 'bad')
      }
    }
  }

  if (fundReserveBtn) {
    fundReserveBtn.onclick = async () => {
      try {
        await ensureConnected()
        requireDistributor()
        const amt = (document.getElementById('fundAmount') as HTMLInputElement).value
        if (!amt) throw new Error('Enter amount')

        const d = new Contract(bond.distributorAddress!, distributorAbi, signer!)
        const gasOpts = await getGasOptions(provider!)
        const tx = await d.fundReserve(ethers.parseUnits(amt, 6), gasOpts)
        toast('Fund reserve sent', tx.hash)
        await tx.wait()
        toast('Reserve funded', 'Confirmed')
        await refreshStats()
      } catch (e: any) {
        toast('Fund reserve failed', e?.message || String(e), 'bad')
      }
    }
  }

  if (depositYieldBtn) {
    depositYieldBtn.onclick = async () => {
      try {
        await ensureConnected()
        requireDistributor()
        const amt = (document.getElementById('yieldAmount') as HTMLInputElement).value
        if (!amt) throw new Error('Enter amount')

        const d = new Contract(bond.distributorAddress!, distributorAbi, signer!)
        const gasOpts = await getGasOptions(provider!)
        const tx = await d.depositYield(ethers.parseUnits(amt, 6), gasOpts)
        toast('Deposit yield sent', tx.hash)
        await tx.wait()
        toast('Yield deposited', 'Confirmed')
        await refreshStats()
      } catch (e: any) {
        toast('Deposit failed', e?.message || String(e), 'bad')
      }
    }
  }

  if (distributeRateBtn) {
    distributeRateBtn.onclick = async () => {
      try {
        await ensureConnected()
        requireDistributor()
        const rate = (document.getElementById('rateAmount') as HTMLInputElement).value
        if (!rate) throw new Error('Enter rate')

        const d = new Contract(bond.distributorAddress!, distributorAbi, signer!)
        const gasOpts = await getGasOptions(provider!)
        const tx = await d.distribute(ethers.parseUnits(rate, 6), gasOpts)
        toast('Distribute rate sent', tx.hash)
        await tx.wait()
        toast('Rate distributed', 'Confirmed')
        await refreshStats()
      } catch (e: any) {
        toast('Distribute failed', e?.message || String(e), 'bad')
      }
    }
  }

  // Treasury
  const treasuryDepositBtn = document.getElementById('treasuryDepositBtn') as HTMLButtonElement | null
  const treasuryWithdrawBtn = document.getElementById('treasuryWithdrawBtn') as HTMLButtonElement | null

  const requireTreasury = () => {
    if (!bond.treasuryAddress) throw new Error('No treasuryAddress set for this bond')
    if (!backendConfig?.contracts?.usdtAddress) throw new Error('USDT_ADDRESS missing in backend config')
  }

  if (treasuryDepositBtn) {
    treasuryDepositBtn.onclick = async () => {
      try {
        await ensureConnected()
        requireTreasury()
        const amt = (document.getElementById('treasuryDeposit') as HTMLInputElement).value
        if (!amt) throw new Error('Enter amount')

        const usdt = new Contract(backendConfig!.contracts.usdtAddress, erc20Abi, signer!)
        const gasOpts = await getGasOptions(provider!)
        const tx = await usdt.transfer(bond.treasuryAddress, ethers.parseUnits(amt, 6), gasOpts)
        toast('Deposit sent', tx.hash)
        await tx.wait()
        toast('Deposited', 'USDT transferred to treasury')
      } catch (e: any) {
        toast('Deposit failed', e?.message || String(e), 'bad')
      }
    }
  }

  if (treasuryWithdrawBtn) {
    treasuryWithdrawBtn.onclick = async () => {
      try {
        await ensureConnected()
        requireTreasury()
        const amt = (document.getElementById('treasuryWithdraw') as HTMLInputElement).value
        if (!amt) throw new Error('Enter amount')

        const to = connectedAddress!
        const t = new Contract(bond.treasuryAddress!, treasuryAbi, signer!)
        const gasOpts = await getGasOptions(provider!)
        const tx = await t.withdrawReserves(to, ethers.parseUnits(amt, 6), gasOpts)
        toast('Withdraw sent', tx.hash)
        await tx.wait()
        toast('Withdrawn', `Sent ${amt} USDT to ${short(to)}`)
      } catch (e: any) {
        toast('Withdraw failed', e?.message || String(e), 'bad')
      }
    }
  }

  // Initial stats
  void refreshStats()
}

async function init() {
  try {
    backendConfig = await getConfig()
  } catch (e: any) {
    toast('Backend config error', e?.message || String(e), 'bad')
  }

  window.addEventListener('hashchange', () => {
    void refresh()
  })

  try {
    const eth = (window as any).ethereum
    if (eth) {
      provider = new BrowserProvider(eth)
      const accounts = await eth.request({ method: 'eth_accounts' })
      if (accounts?.length) {
        signer = await provider.getSigner()
        connectedAddress = await signer.getAddress()
      }
    }
  } catch {
    // ignore
  }

  await refresh()
}

void init()
