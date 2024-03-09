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
        <div>
            <h2>Token Swap</h2>
            <WalletMultiButton />
            <form onSubmit={(e) => {
                e.preventDefault();
                handleSwap();
            }}>
                <input type="text" placeholder="From Token" value={fromToken} onChange={(e) => setFromToken(e.target.value)} />
                <input type="text" placeholder="To Token" value={toToken} onChange={(e) => setToToken(e.target.value)} />
                <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <button type="submit">Swap</button>
            </form>
        </div>
    );
}
