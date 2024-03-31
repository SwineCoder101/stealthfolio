"use client"
import { useState, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { priceSwap, createSwapTransactions } from "../client/JupiterClient";
import Image from "next/image";
import { Connection } from "@solana/web3.js";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

const initialState = {
  id: null,
  name: "",
  sellTkId: "",
  sellAmount: 0,
  buyTkId: "",
  buyQty: 0,
  concealed: true,
};

export default function Swap() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const [rows, setRows] = useState([initialState]);
  const connectionRef = useRef(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const RPC = process.env.NEXT_PUBLIC_MAINNET_RPC;
    connectionRef.current = new Connection(RPC, 'confirmed');
    setHasMounted(true);
  }, []);

  const handleRowChange = (rowId, key, value) => {
    setRows(prevRows => 
      prevRows.map(row => (row.id === rowId ? { ...row, [key]: value } : row))
    );
  };

  const addRow = () => setRows(prevRows => [...prevRows, { ...initialState, id: prevRows.length + 1 }]);

  const removeRow = (rowId) => {
    if (rows.length > 1) {
      setRows(prevRows => prevRows.filter(row => row.id !== rowId));
    }
  };

  const handleConcealChange = (rowId) => {
    setRows(prevRows =>
      prevRows.map(row => (row.id === rowId ? { ...row, concealed: !row.concealed } : row))
    );
  };

  const submitTransaction = async () => {
    if (connected && publicKey) {
      console.log("rows", rows)
      console.log("key", publicKey)
      const transactions = await createSwapTransactions(rows, publicKey.toString());
      const connection = connectionRef.current;
      console.log('running')
    let portfolio = [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].fromToken !== '' || rows[i].toToken !== '') {
        //let toTokenId = getTokenMintAddress(rows[i].toToken);
        //let fromTokenId = getTokenMintAddress(rows[i].fromToken);
        portfolio.push({ id: rows[i].fromToken, vsToken: rows[i].toToken, amount: rows[i].sellAmount * 10000 });
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
  
      try {
        const signature = await sendTransaction(transactions[0], connection, { minContextSlot });
        console.log("Transaction sent with signature:", signature);
  
        const confirmation = await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
        console.log("Transaction confirmed with confirmation:", confirmation);
      } catch (error) {
        console.error("Error sending transaction:", error);
      }
    }
  };
  

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
            {hasMounted && (
            <WalletMultiButton />
            )}
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
                      onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                  <select
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                      value={row.sellTkId}
                      onChange={(e) => handleRowChange(row.id, 'sellTkId', e.target.value)}
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
                      value={row.sellAmount}
                        onChange={(e) => handleRowChange(row.id, 'sellAmount', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                      value={row.buyTkId}
                      onChange={(e) => handleRowChange(row.id, 'buyTkId', e.target.value)}
                    >
                      <option value="">Tokens</option>
                      <option value="SOL">SOL</option>
                      <option value="USDC">USDC</option>
                      <option value="ACHI">ACHI</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      disabled
                      type="number"
                      className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                      value={row.buyQty || ""}
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
                        onClick={addRow}
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
                        onClick={addRow}
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
        </div>
      </div>
    </div>
  );
}
