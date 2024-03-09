"use client";
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { priceSwap, pricePortfolio } from '../client/JupiterClient';

export default function Swap() {
    const wallet = useWallet();
    const [name, setName] = useState('');
    const [fromToken, setFromToken] = useState('');
    const [sellAmount, setSellAmount] = useState(0);
    const [toToken, setToToken] = useState('');
    const [buyAmount, setBuyAmount] = useState(0);
    const [amount, setAmount] = useState(0);
    const [jupPriceData, setJupPriceData] = useState({})

    const handleSwap = async () => {
        if (!wallet.connected) {
            alert('Please connect your wallet.');
            return;
        }

        console.log('Swapping tokens...');
    };

    const getPrices = async () => {
        if (fromToken && toToken && buyAmount) {
            let priceData = await priceSwap(toToken, fromToken, buyAmount);
            console.log(priceData)
            setJupPriceData(priceData)
        } else {
            console.log('Incomplete input');
        }
    };

    return (
        <div className="h-screen bg-gray-100">
            <div className="flex flex-row h-16 bg-gray-200 w-full">
                <h1 className="text-xl font-bold pl-8 my-auto">Stealthfolio</h1>
            </div>
            <div className="p-8 bg-gray-100 space-y-4">
                <h2 className="font-bold text-lg">Place Trade</h2>
                <WalletMultiButton />
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSwap();
                }}>
                    <input type="text" disabled placeholder="TR1" className="bg-gray-200 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" />
                    <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="Name/Label" value={name} onChange={(e) => setName(e.target.value)} />
                    <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="Sell Token" value={fromToken} onChange={(e) => setFromToken(e.target.value)} />
                    <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="Sell Amount" value={sellAmount} onChange={(e) => setSellAmount(e.target.value)} />
                    <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="Buy Token" value={toToken} onChange={(e) => setToToken(e.target.value)} />
                    <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="Buy Amount" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} />
                    <button type="submit" className="bg-gray-50 border border-gray-300 hover:bg-gray-100 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" onClick={() => getPrices()}>Get latest prices</button>
                    <button type="submit" className="bg-gray-50 border border-gray-300 hover:bg-gray-100 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">Swap</button>
                </form>
                {jupPriceData.buyTkId != null &&
                    <div>
                    <p>Buy Token ID: {jupPriceData.buyTkId}</p>
                    <p>Buy Quantity: {jupPriceData.buyQty}</p>
                    <p>Sell Token ID: {jupPriceData.sellTkId}</p>
                    <p>Sell Quantity: {jupPriceData.sellQty}</p>
                    <p>USD Price: {jupPriceData.usdPrice}</p>
                  </div>
                }
            </div>
        </div>
    );
}
