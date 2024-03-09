"use client";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { priceSwap, pricePortfolio } from "../client/JupiterClient";
import { useEffect } from "react";
import Image from 'next/image';
import * as web3 from "@solana/web3.js";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Swap() {
  const wallet = useWallet();
  const [name, setName] = useState("");
  const [fromToken, setFromToken] = useState("");
  const [sellAmount, setSellAmount] = useState(0);
  const [toToken, setToToken] = useState("");
  const [retrievedBuyAmount, setRetrievedBuyAmount] = useState(0);
  const [usdEquivalent, setUsdEquivalent] = useState(0);
  const [amount, setAmount] = useState(0);
  const [accountBalance, setAccountBalance] = useState(null);
  const [jupPriceData, setJupPriceData] = useState({});
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    const newConnection = new web3.Connection(
      web3.clusterApiUrl("devnet"),
      "confirmed"
    );
    setConnection(newConnection);
  }, []);

  const handleSwap = async () => {
    if (!wallet.connected) {
      alert("Please connect your wallet.");
      return;
    }

    // Check balance is sufficient
    const tokenMintAddress = getTokenMintAddress(fromToken);
    const currentBalance = await getTokenBalance(tokenMintAddress);

    if (parseFloat(sellAmount) > currentBalance) {
      alert("You don't have enough tokens to make this trade.");
      return;
    }

    console.log("Swapping tokens...");
  };

  const getPrices = async () => {
    if (fromToken && toToken && sellAmount) {
      let priceData = await priceSwap(toToken, fromToken, sellAmount);
      console.log(priceData);
      setJupPriceData(priceData);
    } else {
      console.log("Incomplete input");
    }
  };

  const getTokenMintAddress = (tokenName) => {
    switch (tokenName) {
      case "SOL":
        return "SOL";
      case "USDC":
        return "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
      case "ETH":
        return "2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk";
      default:
        console.error("Unknown token:", tokenName);
        return null;
    }
  };

  const getTokenBalance = async (tokenMintAddress) => {
    if (!wallet.connected || !wallet.publicKey || !connection) return;

    let balance = 0;
    console.log("tokenMintAddress", tokenMintAddress);
    if (tokenMintAddress === "SOL") {
      balance =
        (await connection.getBalance(wallet.publicKey)) / web3.LAMPORTS_PER_SOL;
      console.log("SOL balance:", balance);
    } else {
      const tokenMint = new web3.PublicKey(tokenMintAddress);
      const accounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        { mint: tokenMint }
      );

      if (accounts.value.length > 0) {
        const accountInfo = accounts.value[0].account.data.parsed.info;
        balance = accountInfo.tokenAmount.uiAmount;
      }
    }

    console.log(`Balance for ${tokenMintAddress}: ${balance}`);
    return balance;
  };

  useEffect(() => {
    const updateTokenBalance = async () => {
      if (fromToken && wallet.connected) {
        const tokenMintAddress = getTokenMintAddress(fromToken);
        console.log("TOKEN MINT ADDRESS", tokenMintAddress);
        const balance = await getTokenBalance(tokenMintAddress);
        console.log("BALANCE", balance);
        setAccountBalance(balance);
      }
    };

    // const updateUSDEquivalent = async () => {
    //     if (fromToken && wallet.connected) {
    //     const tokenMintAddress = getTokenMintAddress(fromToken);
    //     console.log('TOKEN MINT ADDRESS', tokenMintAddress)
    //     let priceData = await priceSwap(tokenMintAddress, tokenMintAddress, sellAmount);
    //     const usdEquivalent = priceData.usdPrice;
    //     console.log('USD Equivalent', usdEquivalent.usdPrice)
    //     setUsdEquivalent(usdEquivalent)
    //     }
    // };

    updateTokenBalance();
    // updateUSDEquivalent()
  }, [fromToken, wallet.connected, wallet.publicKey]);

  useEffect(() => {
    const fetchPrices = async () => {
      if (fromToken && toToken && sellAmount) {
        try {
          let priceData = await priceSwap(toToken, fromToken, sellAmount);
          console.log(priceData);
          setRetrievedBuyAmount(priceData.buyQty);
        } catch (error) {
          console.error("Error fetching prices:", error);
        }
      } else {
        console.log("Incomplete input");
      }
    };

    fetchPrices();
  }, [fromToken, sellAmount, toToken]);

  return (
    <div className="h-screen bg-black">
      <div className="hidden h-full flex-col md:flex">
        <div className="bg-black text-white container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16 border-b border-gray-900">
           <div className="flex flex-row space-x-2">
            <div className="bg-gray-900 rounded-lg h-8 w-8 p-1">
            <Image
            src="/stealthy.png"
            width={30}
            height={30}
            alt="Picture of the author"
          />
          </div>
          <h2 className="text-2xl font-light text-gray-200"><b>Stealth</b>folio</h2>
          </div>
          <div className="ml-auto flex w-full space-x-2 sm:justify-end">
          <p className="my-auto font-light">proudly on solana</p>
          <img
            className="h-[2%] w-[2%] my-auto"
            src="/solana.png"
            alt="Picture of the author"
          />
            <WalletMultiButton />
            
          </div>
        </div>
        <div className="p-8 space-y-4">
        <p className="text-2xl text-white font-light">Order book</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSwap();
          }}
        >
          <input
            type="text"
            disabled
            placeholder="TR1"
            className="bg-gray-200 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
          />
          <input
            type="text"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            placeholder="Name/Label"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
          >
            <option value="">Select Sell Token</option>
            <option value="SOL">SOL</option>
            <option value="USDC">USDC</option>
            <option value="ETH">ETH</option>
          </select>
          {accountBalance !== null && (
            <p>Max available to sell: {accountBalance}</p>
          )}
          <input
            type="number"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            placeholder="Sell Amount"
            value={sellAmount}
            onChange={(e) => setSellAmount(e.target.value)}
          />
          {/* <p className="text-xs">USD amount: {usdEquivalent} </p> */}
          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
          >
            <option value="">Select Buy Token</option>
            <option value="SOL">SOL</option>
            <option value="USDC">USDC</option>
            <option value="ETH">ETH</option>
          </select>
          <input
            disabled
            type="number"
            className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            value={retrievedBuyAmount || ""}
            placeholder="Buy Amount"
          />
          {/* <p className="text-xs">Balance:</p>
                    <p className="text-xs">USD amount: (-X.XX%)</p> */}
          {/* <button type="submit" className="bg-gray-50 border border-gray-300 hover:bg-gray-100 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" onClick={() => getPrices()}>Get latest prices</button> */}
          <button
            type="submit"
            className="bg-gray-50 border border-gray-300 hover:bg-gray-100 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
          >
            Swap
          </button>
        </form>
        {jupPriceData.buyTkId != null && (
          <div>
            <p>Buy Token ID: {jupPriceData.buyTkId}</p>
            <p>Buy Quantity: {jupPriceData.buyQty}</p>
            <p>Sell Token ID: {jupPriceData.sellTkId}</p>
            <p>Sell Quantity: {jupPriceData.sellQty}</p>
            <p>USD Price: {jupPriceData.usdPrice}</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
