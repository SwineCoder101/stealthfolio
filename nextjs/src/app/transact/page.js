"use client";
import { useState, useRef, useEffect } from "react";
import { Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  priceSwap,
  pricePortfolio,
  createSwapTransactions,
} from "../client/JupiterClient";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loader";

export default function Swap() {
  const { publicKey, signAllTransactions, connected, sendTransaction } =
    useWallet();
  const [fromToken, setFromToken] = useState("");
  const [sellAmount, setSellAmount] = useState(0);
  const [toToken, setToToken] = useState("");
  const [lastUpdatedRowId, setLastUpdatedRowId] = useState(null);
  const [accountBalance, setAccountBalance] = useState(null);
  const [jupPriceData, setJupPriceData] = useState({});
  const [connection, setConnection] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [lastSellAmtUpdate, setLastSellAmtUpdate] = useState(0);
  const [lastBuyAmtUpdate, setLastBuyAmtUpdate] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState('');
  const [transactionSignature, setTransactionSignature] = useState("");

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

  const RPC = process.env.NEXT_PUBLIC_MAINNET_RPC;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const removeRow = (rowId) => {
    if (rows.length > 1 && !isRemoving) {
      setIsRemoving(true);
      setRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
      setTimeout(() => setIsRemoving(false), 1000);
    }
  };

  const handleSellAmountChange = async (rowId, newSellAmount) => {
    const updatedRows = rows.map((row) => {
      if (row.id === rowId) {
        return { ...row, sellAmount: newSellAmount };
      }
      return row;
    });
    console.log(newSellAmount)
    setRows(updatedRows);
    setLastSellAmtUpdate(newSellAmount)
    console.log(newSellAmount)
    setLastUpdatedRowId(rowId);
    updateBuyAmountForRow(rowId);
  };

  const handleBuyAmountChange = async (rowId, newBuyAmount) => {
    const updatedRows = rows.map((row) => {
      if (row.id === rowId) {
        return { ...row, buyAmount: newBuyAmount };
      }
      return row;
    });
    setRows(updatedRows);
    setLastBuyAmtUpdate(newBuyAmount)
    setLastUpdatedRowId(rowId);
    updateSellAmountForRow(rowId);
  };
  
  const updateSellAmountForRow = async (rowId) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row || !row.fromToken || !row.toToken || !row.buyAmount) {
      console.log("Incomplete input for price update");
      return;
    }
  
    try {
      console.log('running');
      console.log(row.fromToken, row.toToken, row.buyAmount);
      let priceData = await priceSwap(row.fromToken, row.toToken, row.buyAmount);
      setRows((currentRows) =>
        currentRows.map((r) =>
          r.id === rowId ? { ...r, sellAmount: priceData.sellQty } : r
        )
      );


    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  useEffect(() => {
    const isRowChanged = (prevRow, newRow) => {
      return (
        prevRow.fromToken !== newRow.fromToken ||
        prevRow.sellAmount !== newRow.sellAmount ||
        prevRow.toToken !== newRow.toToken
      );
    };

    const latestRowData = new Map();

    rows.forEach((row) => {
      const prevRowData = latestRowData.get(row.id) || {};
      if (isRowChanged(prevRowData, row)) {
        updateBuyAmountForRow(row.id);
      }
      latestRowData.set(row.id, { ...row });
    });

    return () => latestRowData.clear();
  }, [lastSellAmtUpdate]);
  
  useEffect(() => {
    const isRowChanged = (prevRow, newRow) => {
      return (
        prevRow.fromToken !== newRow.fromToken ||
        prevRow.sellAmount !== newRow.sellAmount ||
        prevRow.toToken !== newRow.toToken
      );
    };

    const latestRowData = new Map();

    rows.forEach((row) => {
      const prevRowData = latestRowData.get(row.id) || {};
      if (isRowChanged(prevRowData, row)) {
        updateBuyAmountForRow(row.id);
      }
      latestRowData.set(row.id, { ...row });
    });

    return () => latestRowData.clear();
  }, [lastSellAmtUpdate]);

  const handleSelectSellToken = (rowId, e) => {
    const newValue = e.target.value;

    setRows(
      rows.map((row) => {
        if (row.id === rowId) {
          return { ...row, fromToken: newValue };
        }
        return row;
      })
    );
  };

  const handleSelectBuyToken = (rowId, e) => {
    const newValue = e.target.value;
    setRows(
      rows.map((row) => {
        if (row.id === rowId) {
          return { ...row, toToken: newValue };
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
    setRows(updatedRows);
  };

  // append signature to block URI, can use solscan to find transaction hash
  // 1. get signature and find transaction hash - const signature = await sendTransaction(transactions[0], connection, { minContextSlot });
  // 2. wait for confirmation of transaction await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
  // 3. Show modal
  const submitTransaction = async () => {
    if (connected && publicKey) {
      setLoading(true)
      let portfolio = [];
      console.log("submitted rows", rows);
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].fromToken !== "" || rows[i].toToken !== "") {
          portfolio.push({
            id: rows[i].toToken,
            vsToken: rows[i].fromToken,
            amount: rows[i].sellAmount * 100000,
          });
        } else {
          continue;
        }
      }
      const pricedPortfolio = await pricePortfolio(portfolio);

      const swapItems = pricedPortfolio;
      console.log("SWAP ITEMS");
      const transactions = await createSwapTransactions(
        swapItems,
        publicKey.toString()
      );

      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = await connection.getLatestBlockhashAndContext();

      try {
      const signature = await sendTransaction(transactions[0], connection, {
        minContextSlot,
      });

      console.log("signature", signature);
      setTransactionSignature(signature);

      let confirmation = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });
      if (confirmation) {
        setConfirmationDetails(blockhash);
        setShowDialog(true);
      }
     } catch (error) {
      console.error("Transaction canceled:", error);
      setLoading(false);
      return;
    }
    setLoading(false);
  }};

  
  const updateBuyAmountForRow = async (rowId) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row || !row.fromToken || !row.toToken || !row.sellAmount) {
      console.log("Incomplete input for price update");
      return;
    }
  
    try {
      let priceData = await priceSwap(row.toToken, row.fromToken, row.sellAmount);
      console.log(priceData)
      setRows((currentRows) =>
        currentRows.map((r) =>
          r.id === rowId ? { ...r, buyAmount: priceData.buyQty } : r
        )
      );
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

  useEffect(() => {
    const newConnection = new Connection(RPC, "confirmed");
    setConnection(newConnection);
  }, []);

  const handleSwap = async () => {
    if (!connected) {
      alert("Please connect your wallet.");
      return;
    }

    const tokenMintAddress = getTokenMintAddress(fromToken);
    const currentBalance = await getTokenBalance(tokenMintAddress);

    if (parseFloat(sellAmount) > currentBalance) {
      alert("You don't have enough tokens to make this trade.");
      return;
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
    if (tokenMintAddress === "SOL") {
      balance =
        (await connection.getBalance(publicKey)) / web3.LAMPORTS_PER_SOL;
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

    return balance;
  };

  useEffect(() => {
    const updateTokenBalance = async () => {
      if (fromToken && connected) {
        const tokenMintAddress = getTokenMintAddress(fromToken);
        const balance = await getTokenBalance(tokenMintAddress);
        setAccountBalance(balance);
      }
    };

    updateTokenBalance();
  }, [fromToken, connected, publicKey]);

  useEffect(() => {
    const fetchPrices = async () => {
      if (fromToken && toToken && sellAmount) {
        try {
          console.log("fromToken", fromToken);
          console.log("toToken", toToken);
          let priceData = await priceSwap(toToken, fromToken, sellAmount);
          setRetrievedBuyAmount(priceData.buyQty);
        } catch (error) {
          console.error("Error fetching prices:", error);
        }
      } else {
        return;
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
            <p className="text-white text-xs my-auto pl-8 w-32">funds</p>
          </div>
          <div className="ml-auto flex w-full space-x-2 sm:justify-end">
            <p className="my-auto font-light">powered by solana</p>
            <img
              className="h-[2%] w-[2%] my-auto"
              src="/solana.png"
              alt="Picture of the author"
            />
            {hasMounted && <WalletMultiButton />}
          </div>
        </div>
        <div className="p-8 space-y-4">
          <p className="text-2xl text-white font-light text-center">
            Order book
          </p>
          <Table className="w-50 mx-auto">
            <TableCaption>
              Concealed trades are completely invisible to malicious market
              participants.
            </TableCaption>
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
                    <select
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                      value={row.fromToken}
                      onChange={(e) => handleSelectSellToken(row.id, e)}
                    >
                      <option value="">Tokens</option>
                      <option value="SOL">SOL</option>
                      <option value="USDC">USDC</option>
                      <option value="ACHI">ACHI</option>
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                  <Input
                    type="number"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    placeholder="Sell Amount"
                    value={row.buyAmount === '' ? 0 : row.sellAmount}
                    onChange={(e) =>
                      handleSellAmountChange(row.id, e.target.value)
                    }
                  />
                  </TableCell>
                  <TableCell>
                    {" "}
                    <select
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                      value={row.toToken}
                      onChange={(e) => handleSelectBuyToken(row.id, e)}
                    >
                      <option value="">Tokens</option>
                      <option value="SOL">SOL</option>
                      <option value="USDC">USDC</option>
                      <option value="ACHI">ACHI</option>
                    </select>
                  </TableCell>
                  <TableCell>
                  <Input
                    type="number"
                    className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    placeholder="Buy Amount"
                    value={row.sellAmount === '' ? 0 : row.buyAmount}
                    onChange={(e) =>
                      handleBuyAmountChange(row.id, e.target.value)
                    }
                  />
                  </TableCell>
                  <TableCell>
                    <div className="flex">
                      <Switch
                        id="airplane-mode"
                        checked={row.concealed}
                        onCheckedChange={() => handleConcealChange(row.id)}
                      />
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
          {!loading ? (<>
            <button
              type="submit"
              className="bg-gray-50 py-2 px-8 text-lg border border-gray-300 hover:bg-gray-200 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              onClick={() => submitTransaction()}
            >
              Transact
            </button></>) :
            (<LoadingSpinner />)}
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
      {hasMounted && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <div>
                {transactionSignature && <a href={`https://solscan.io/tx/${transactionSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                ><p className="">View your transaction on SolScan: {transactionSignature}</p></a>}
              </div>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4"></div>
              <div className="grid grid-cols-4 items-center gap-4"></div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// update buy amount everytime the sell amount is changed
// display equivillent USD value on right side of sell amount box
// ungray buy make it bi-directional