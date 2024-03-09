"use client";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { priceSwap, pricePortfolio, createSwapTransactions, confirmTransactions, confirmTransaction } from "../client/JupiterClient";
import { useEffect } from "react";
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

export default function Swap() {
  const { publicKey, signAllTransactions, connected } = useWallet();
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

  const removeRow = (rowId) => {
    if (rows.length > 1 && !isRemoving) {
      setIsRemoving(true);
      setRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
      setTimeout(() => setIsRemoving(false), 1000);
    }
  };

const handleSellAmountChange = (rowId, newSellAmount) => {
  const updatedRows = rows.map(row => {
    if (row.id === rowId) {
      return { ...row, sellAmount: newSellAmount };
    }
    return row;
  });
  setRows(updatedRows);
  updateBuyAmountForRow(rowId);
};

  const handleSelectSellToken = (rowId, value) => {
    setRows(
      rows.map((row) => {
        if (row.id === rowId) {
          return { ...row, fromToken: value };
        }
        return row;
      })
    );
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
        // let toTokenId = getTokenMintAddress(rows[i].toToken);
        // let fromTokenId = getTokenMintAddress(rows[i].fromToken);
        portfolio.push({ id: rows[i].toToken, vsToken: rows[i].fromToken, amount: rows[i].sellAmount });
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
    const signedTransactions = await signAllTransactions(transactions);

    // const signatures = signedTransactions.map(t => t.signatures);
    // console.log('signatures', signatures);
    // await confirmTransactions(transactions, base58.encode(signedTransactions[0].signatures[0]));

    await confirmTransaction(base58.encode(signedTransactions[0].signatures[0]));
    }
  }

  const updateBuyAmountForRow = async (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (!row.fromToken || !row.toToken || !row.sellAmount) {
      console.log("Incomplete input for price update");
      return;
    }
    try {
      let priceData = await priceSwap(row.toToken, row.fromToken, row.sellAmount);
      setRows(rows.map(r => r.id === rowId ? { ...r, retrievedBuyAmount: priceData.buyQty } : r));
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  const handleConcealChange = (rowId) => {
    const updatedRows = rows.map((row) => {
      if (row.id === rowId) {
        return { ...row, concealed: !row.concealed };
      }
      return row;
    });
    setRows(updatedRows);
  };

  const handleSelectBuyToken = (rowId, value) => {
    setRows(
      rows.map((row) => {
        if (row.id === rowId) {
          return { ...row, toToken: value };
        }
        return row;
      })
    );
  };

  useEffect(() => {
    const newConnection = new web3.Connection(
      web3.clusterApiUrl("devnet"),
      "confirmed"
    );
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
      case "ETH":
        return "2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk";
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
            <h2 className="text-2xl font-light text-gray-200">
              <b>Stealth</b>folio
            </h2>
            <p className="text-white text-xs my-auto pl-8 underline">
              transact
            </p>
            <p className="text-white text-xs my-auto pl-8">portfolio</p>
            <p className="text-white text-xs my-auto pl-8 w-32">
              funds
            </p>
          </div>
          <div className="ml-auto flex w-full space-x-2 sm:justify-end">
            <p className="my-auto font-light">powered by solana</p>
            <img
              className="h-[2%] w-[2%] my-auto"
              src="/solana.png"
              alt="Picture of the author"
            />
            <WalletMultiButton />
          </div>
        </div>
        <div className="p-8 space-y-4">
          <p className="text-2xl text-white font-light text-center">
            Order book
          </p>
          <Table className="w-50 mx-auto">
            <TableCaption>Concealed trades are completely invisible to malicious market participants.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Trade Id</TableHead>
                <TableHead>Codename</TableHead>
                <TableHead>Sell Token</TableHead>
                <TableHead>
                  Sell Amount{" "}
                  {accountBalance !== null && (
                    <span>(Max available to sell: {accountBalance})</span>
                  )}
                </TableHead>
                <TableHead>Buy Token</TableHead>
                <TableHead>Buy Amount</TableHead>
                <TableHead className="text-right">Conceal</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {" "}
                    <Input
                      type="text"
                      disabled
                      placeholder={`TR${index + 1}`}
                      className="bg-gray-200 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                      placeholder="codename"
                      value={row.name}
                      onChange={(e) => handleNameChange(row.id, e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      onValueChange={(value) =>
                        handleSelectSellToken(row.id, value)
                      }
                    >
                      <SelectTrigger className="w-[180px] bg-white">
                        <SelectValue placeholder="Select Sell Token" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Tokens</SelectLabel>
                          <SelectItem value="SOL">SOL</SelectItem>
                          <SelectItem value="USDC">USDC</SelectItem>
                          <SelectItem value="ETH">ETH</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                      placeholder="Sell Amount"
                      value={row.sellAmount}
                        onChange={(e) => handleSellAmountChange(row.id, e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    {" "}
                    <Select
                      onValueChange={(value) =>
                        handleSelectBuyToken(row.id, value)
                      }
                    >
                      <SelectTrigger className="w-[180px] bg-white">
                        <SelectValue placeholder="Select Buy Token" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Tokens</SelectLabel>
                          <SelectItem value="SOL">SOL</SelectItem>
                          <SelectItem value="USDC">USDC</SelectItem>
                          <SelectItem value="ETH">ETH</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      disabled
                      type="number"
                      className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                      value={retrievedBuyAmount || ""}
                      placeholder="Buy Amount"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex">
                      <Switch id="airplane-mode" checked={row.concealed} onCheckedChange={() => handleConcealChange(row.id)}/>
                    </div>
                  </TableCell>
                  <TableCell className="text-white bold hover:cursor-pointer text-lg">
                    {rows.length === 1 && (
                      <span
                        onClick={addNewRow}
                        className="cursor-pointer text-lg p-2"
                      >
                        +
                      </span>
                    )}
                    {rows.length > 1 && index !== rows.length - 1 && (
                      <span
                        onClick={() => removeRow(row.id)}
                        className="cursor-pointer text-lg p-2"
                      >
                        -
                      </span>
                    )}
                    {index === rows.length - 1 && rows.length !== 1 && (
                      <span
                        onClick={addNewRow}
                        className="cursor-pointer text-lg p-2"
                      >
                        +
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-col items-center">
            <button
              type="submit"
              className="bg-gray-50 py-2 px-8 text-lg border border-gray-300 hover:bg-gray-200 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              onClick={() => submitTransaction()}
            >
              Transact
            </button>
          </div>
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
