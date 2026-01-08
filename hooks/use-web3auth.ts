"use client";

import { useEffect, useState, useRef } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x1",
  rpcTarget: "https://eth.llamarpc.com",
  displayName: "Ethereum Mainnet",
  blockExplorerUrl: "https://etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
};



export const useWeb3Auth = () => {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const web3authRef = useRef<Web3Auth | null>(null);

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

        if (web3auth.connected) {
          setLoggedIn(true);
          const user = await web3auth.getUserInfo();
          setUserInfo(user);
        }
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3authRef.current) {
      console.error("Web3Auth not initialized");
      return;
    }
    try {
      const web3authProvider = await web3authRef.current.connect();
      setProvider(web3authProvider);
      if (web3authRef.current.connected) {
        setLoggedIn(true);
        const user = await web3authRef.current.getUserInfo();
        setUserInfo(user);
        return user;
      }
    } catch (error) {
      console.error("Error logging in:", error);
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
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return { provider, loggedIn, login, logout, userInfo, isInitializing, web3auth: web3authRef.current };
};
