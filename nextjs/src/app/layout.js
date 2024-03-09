"use client";
import { WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import './globals.css'
import { Jost } from 'next/font/google'

const inter = Jost({ subsets: ['latin'] })

export default function RootLayout({ children }) {
    const wallets = [new PhantomWalletAdapter()];

    return (
      <html>
        <body className={inter.className}>
          <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
        </body>
      </html>
    );
}
