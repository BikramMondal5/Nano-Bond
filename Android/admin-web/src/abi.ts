export const bondAbi = [
  'function totalSupply() view returns (uint256)',
  'function totalBackedValue() view returns (uint256)',
  'function maturityDate() view returns (uint256)',
  'function addAsset(string uri, uint256 value) external',
  'function setMaturityDate(uint256 _newDate) external',
] as const

export const distributorAbi = [
  'function cumulativeYieldPerToken() view returns (uint256)',
  'function reserve() view returns (uint256)',
  'function fundReserve(uint256 amount) external',
  'function depositYield(uint256 amount) external',
  'function distribute(uint256 ratePerToken) external',
] as const

export const treasuryAbi = [
  'function withdrawReserves(address to, uint256 amount) external',
] as const

export const erc20Abi = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
] as const
