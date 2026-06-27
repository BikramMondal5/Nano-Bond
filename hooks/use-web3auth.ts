"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { ethers } from "ethers";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "";

// Mantle Sepolia Testnet Configuration
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x138b", // 5003 in hex (Mantle Sepolia)
  rpcTarget: "https://rpc.sepolia.mantle.xyz",
  displayName: "Mantle Sepolia",
  blockExplorerUrl: "https://sepolia.mantlescan.xyz",
  ticker: "MNT",
  tickerName: "Mantle",
};

export const useWeb3Auth = () => {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const web3authRef = useRef<Web3Auth | null>(null);

  // Get wallet address from provider
  const getWalletAddress = useCallback(async (web3Provider: IProvider) => {
    try {
      const ethersProvider = new ethers.BrowserProvider(web3Provider);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);

      // Get balance
      const balanceWei = await ethersProvider.getBalance(address);
      const balanceEth = ethers.formatEther(balanceWei);
      setBalance(parseFloat(balanceEth).toFixed(4));

      return address;
    } catch (error) {
      console.error("Error getting wallet address:", error);
      setError("Failed to get wallet address");
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        if (web3authRef.current) {
          return;
        }

        const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

        const web3auth = new Web3Auth({
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          privateKeyProvider,
        });

        web3authRef.current = web3auth;
        await web3auth.initModal();
        setProvider(web3auth.provider);

        if (web3auth.connected && web3auth.provider) {
          setLoggedIn(true);
          const user = await web3auth.getUserInfo();
          setUserInfo(user);
          await getWalletAddress(web3auth.provider);
        }
      } catch (error: any) {
        console.error("Error initializing Web3Auth:", error);
        setError(error?.message || "Failed to initialize Web3Auth");
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [getWalletAddress]);

  const login = async () => {
    if (!web3authRef.current) {
      console.error("Web3Auth not initialized");
      setError("Web3Auth not initialized");
      return;
    }
    // Do NOT set state here (e.g. setError(null)) because it breaks the synchronous
    // user gesture context required by browsers to open popups!
    try {
      const web3authProvider = await web3authRef.current.connect();
      setError(null);
      setProvider(web3authProvider);
      if (web3authRef.current.connected && web3authProvider) {
        setLoggedIn(true);
        const user = await web3authRef.current.getUserInfo();
        setUserInfo(user);
        const address = await getWalletAddress(web3authProvider);
        return { user, address };
      }
    } catch (error: any) {
      console.error("Error logging in:", error);
      setError(error?.message || "Failed to login");
      throw error;
    }
  };

  const logout = async () => {
    if (!web3authRef.current) return;
    try {
      await web3authRef.current.logout();
      setProvider(null);
      setLoggedIn(false);
      setUserInfo(null);
      setWalletAddress(null);
      setBalance(null);
      setError(null);
    } catch (error: any) {
      console.error("Error logging out:", error);
      setError(error?.message || "Failed to logout");
    }
  };

  // Get ethers provider for contract interactions
  const getEthersProvider = useCallback(() => {
    if (!provider) return null;
    return new ethers.BrowserProvider(provider);
  }, [provider]);

  // Get signer for transactions
  const getSigner = useCallback(async () => {
    const ethersProvider = getEthersProvider();
    if (!ethersProvider) return null;
    return await ethersProvider.getSigner();
  }, [getEthersProvider]);

  return {
    provider,
    loggedIn,
    login,
    logout,
    userInfo,
    walletAddress,
    balance,
    isInitializing,
    error,
    web3auth: web3authRef.current,
    getEthersProvider,
    getSigner
  };
};

