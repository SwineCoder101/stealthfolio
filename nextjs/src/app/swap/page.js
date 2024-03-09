"use client";
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Swap() {
    const wallet = useWallet();
    const [fromToken, setFromToken] = useState('');
    const [toToken, setToToken] = useState('');
    const [amount, setAmount] = useState(0);

    const handleSwap = async () => {
        if (!wallet.connected) {
            alert('Please connect your wallet.');
            return;
        }

        console.log('Swapping tokens...');
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
                    <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="From Token" value={fromToken} onChange={(e) => setFromToken(e.target.value)} />
                    <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="To Token" value={toToken} onChange={(e) => setToToken(e.target.value)} />
                    <input type="number" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <button type="submit" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">Swap</button>
                </form>
            </div>
        </div>
    );
}
