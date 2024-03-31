"use client";
import { useState, useRef, useEffect } from "react";
import { Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { priceSwap, pricePortfolio, createSwapTransactions, confirmTransactions, confirmTransaction } from "../client/JupiterClient";
import bs58 from "bs58";
import Image from "next/image";
import * as web3 from "@solana/web3.js";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import base58 from "bs58";
import { send } from "process";

export default function Swap() {
  const { publicKey, signAllTransactions, connected, sendTransaction } = useWallet();
  const [name, setName] = useState("");
  const [fromToken, setFromToken] = useState("");
  const [sellAmount, setSellAmount] = useState(0);
  const [toToken, setToToken] = useState("");
  const [lastUpdatedRowId, setLastUpdatedRowId] = useState(null);
  const [retrievedBuyAmount, setRetrievedBuyAmount] = useState(0);
  const [usdEquivalent, setUsdEquivalent] = useState(0);
  const [amount, setAmount] = useState(0);
  const [accountBalance, setAccountBalance] = useState(null);
  const [jupPriceData, setJupPriceData] = useState({});
  const [connection, setConnection] = useState(null);
  const timeoutRef = useRef(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [rows, setRows] = useState([
    {
      id: 1,
      name: "",
      fromToken: "",
      sellAmount: 0,
      toToken: "",
      buyAmount: 0,
      concealed: true,
    },
    {
      id: 2,
      name: "",
      fromToken: "",
      sellAmount: 0,
      toToken: "",
      buyAmount: 0,
      concealed: true,
    },
    {
      id: 3,
      name: "",
      fromToken: "",
      sellAmount: 0,
      toToken: "",
      buyAmount: 0,
      concealed: true,
    },
  ]);

  const addNewRow = () => {
    const newRow = {
      id: rows.length + 1,
      name: "",
      fromToken: "",
      sellAmount: 0,
      toToken: "",
      buyAmount: 0,
      concealed: true,
    };
    setRows([...rows, newRow]);
  };
  const prevRowsRef = useRef(rows);

  const RPC = process.env.NEXT_PUBLIC_MAINNET_RPC;

  const removeRow = (rowId) => {
    if (rows.length > 1 && !isRemoving) {
      setIsRemoving(true);
      setRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
      setTimeout(() => setIsRemoving(false), 1000);
    }
  };

  const handleSellAmountChange = async (rowId, newSellAmount) => {
    const updatedRows = rows.map(row => {
      if (row.id === rowId) {
        return { ...row, sellAmount: newSellAmount };
      }
      return row;
    });
  
    setRows(updatedRows);
    setLastUpdatedRowId(rowId);
  };

  useEffect(() => {
    // Function to compare relevant row data
    const isRowChanged = (prevRow, newRow) => {
      return prevRow.fromToken !== newRow.fromToken ||
             prevRow.sellAmount !== newRow.sellAmount ||
             prevRow.toToken !== newRow.toToken;
    };
  
    // Map to store the latest row data for comparison
    const latestRowData = new Map();
  
    rows.forEach(row => {
      const prevRowData = latestRowData.get(row.id) || {};
      if (isRowChanged(prevRowData, row)) {
        // Update the buy amount if the relevant data has changed
        updateBuyAmountForRow(row.id);
      }
      // Update the map with the latest row data
      latestRowData.set(row.id, { ...row });
    });
  
    // Cleanup function to clear the map
    return () => latestRowData.clear();
  }, [rows]); // Watch for changes in the rows
  

  const handleSelectSellToken = (rowId, e) => {
    const newValue = e.target.value;
   
    setRows(rows.map(row => {
      if (row.id === rowId) {
        return { ...row, fromToken: newValue };
      }
      console.log(rowId)
      console.log(newValue)
      console.log('return row')
      return row;
    }));
    // setTimeout(() => {
    //   console.log('buy run 2')
    //   updateBuyAmountForRow(rowId);
    // }, 2000);
  };
  
  const handleSelectBuyToken = (rowId, e) => {
    const newValue = e.target.value;
    setRows(rows.map(row => {
      if (row.id === rowId) {
        return { ...row, toToken: newValue };
      }
      return row;
    }));
  };
  
  const handleNameChange = (rowId, newName) => {
    const updatedRows = rows.map((row) => {
      if (row.id === rowId) {
        return { ...row, name: newName };
      }
      return row;
    });
    console.log(rows)
    setRows(updatedRows);
  };

  const submitTransaction = async () => {
    console.log(connected)
    console.log(publicKey)
    console.log('RUNNING')
    if (connected && publicKey) {
      console.log('running')
    let portfolio = [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].fromToken !== '' || rows[i].toToken !== '') {
        //let toTokenId = getTokenMintAddress(rows[i].toToken);
        //let fromTokenId = getTokenMintAddress(rows[i].fromToken);
        portfolio.push({ id: rows[i].fromToken, vsToken: rows[i].toToken, amount: rows[i].sellAmount });
      } else {
        continue;
      }
    }
    console.log(portfolio);
    const pricedPortfolio = await pricePortfolio(portfolio);
    console.log(pricedPortfolio);

    const swapItems = pricedPortfolio;
    console.log('swap items:', swapItems)
    console.log('public key:', publicKey.toString())
    const transactions = await createSwapTransactions(swapItems, publicKey.toString());
    console.log('transactions', transactions);
    // const signedTransactions = await signAllTransactions(transactions);

      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
    } = await connection.getLatestBlockhashAndContext();


    const signature = await sendTransaction(transactions[0], connection, { minContextSlot });
    console.log(signature)
    let confirmation = await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
    
    console.log(confirmation)
    // const signatures = signedTransactions.map(t => t.signatures);
    // console.log('signatures', signatures);
    // await confirmTransactions(transactions, base58.encode(signedTransactions[0].signatures[0]));

    //signature
    // await confirmTransaction(base58.encode(signature),connection);
    }
  }

  
  const updateBuyAmountForRow = async (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (!row || !row.fromToken || !row.toToken || !row.sellAmount) {
      console.log("Incomplete input for price update");
      return;
    }
  
    await new Promise(resolve => setTimeout(resolve, 2000));
  
    try {
      console.log('Updating buy amount for row', rowId);
      let priceData = await priceSwap(row.toToken, row.fromToken, row.sellAmount);
  
      setRows(currentRows => 
        currentRows.map(r => r.id === rowId ? { ...r, buyAmount: priceData.buyQty } : r)
      );
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };
  

  
  // const updateBuyAmountForRow = async (rowId) => {
  //   console.log('buy run')
  //   console.log(rowId)
  //   const row = rows.find(r => r.id === rowId);
  //   if (!row.fromToken || !row.toToken || !row.sellAmount) {
  //     console.log("Incomplete input for price update");
  //     return;
  //   }
  //   try {
  //     console.log('rows according')
  //     console.log(rows)
  //     let priceData = await priceSwap(row.toToken, row.fromToken, row.sellAmount);
  //     setRows(rows.map(r => r.id === rowId ? { ...r, buyAmount: priceData.buyQty } : r));
  //   } catch (error) {
  //     console.error("Error fetching prices:", error);
  //   }
  // };

  const handleConcealChange = (rowId) => {
    const updatedRows = rows.map((row) => {
      if (row.id === rowId) {
        return { ...row, concealed: !row.concealed };
      }
      return row;
    });
    setRows(updatedRows);
  };



  useEffect(() => {
    // const newConnection = new web3.Connection(
    //   web3.clusterApiUrl("mainnet-beta"),
    //   "confirmed"
    // );
    const newConnection = new Connection(RPC, 'confirmed');
    setConnection(newConnection);
  }, []);

  const handleSwap = async () => {
    if (!connected) {
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
      case "ACHI":
        return "4rUfhWTRpjD1ECGjw1UReVhA8G63CrATuoFLRVRkkqhs";
      default:
        console.error("Unknown token:", tokenName);
        return null;
    }
  };

  const getTokenBalance = async (tokenMintAddress) => {
    if (!connected || !publicKey || !connection) return;

    let balance = 0;
    console.log("tokenMintAddress", tokenMintAddress);
    if (tokenMintAddress === "SOL") {
      balance =
        (await connection.getBalance(publicKey)) / web3.LAMPORTS_PER_SOL;
      console.log("SOL balance:", balance);
    } else {
      const tokenMint = new web3.PublicKey(tokenMintAddress);
      const accounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
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
      if (fromToken && connected) {
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
  }, [fromToken, connected, publicKey]);

  useEffect(() => {
    const fetchPrices = async () => {
      if (fromToken && toToken && sellAmount) {
        try {
          console.log(rows)
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
    <div className="h-screen bg-[#0f181f]">
      <div className="hidden h-full flex-col md:flex">
        <div className="bg-[#0f181f] text-white container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16 border-b border-[#232d3c]">
          <div className="flex flex-row space-x-2">
            <h2 className="text-3xl text-gray-200 tracking-wide" >
              <b>RIFT</b>
            </h2>
            </div>
            <div className="flex align-center items-center tracking-tight font-medium" style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
            <p className="text-[#7d8b95] text-xs my-auto pl-8" >
              TRANSACT
            </p>
            <p className="text-[#7d8b95] text-xs my-auto pl-8">PORTFOLIO</p>
            <p className="text-[#7d8b95] text-xs my-auto pl-8 w-32">
              FUNDS
            </p>
            </div>
          <div className="flex">
            <span className="border border-[#1c2836] bg-[#0c1c28] p-2 tracking-tight font-medium" style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
              <p className="my-auto text-xs">SIGN IN</p>
            </span>
          </div>
        </div>
       
      </div>
    </div>
  );
}
