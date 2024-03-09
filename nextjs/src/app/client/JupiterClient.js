import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
// import { TokenInfo } from "@solana/spl-token-registry"
import fetch from 'cross-fetch';
// import { Wallet } from '@project-serum/anchor';
// import bs58 from 'bs58';
import dotenv from 'dotenv';


// setup environment variables
dotenv.config();
const { SOLANA_NETWORK, PRIVATE_KEY, DEVNET_RPC,CHAIN_ID,MAINNET_RPC} = process.env;

const RPC = MAINNET_RPC || 'https://api.devnet.solana.com';
const chainId = CHAIN_ID;

//returns
// {
//     buyTkId: 'ETH',
//     buyQty: 0.186275,
//     sellTkId: 'USDC',
//     sellQty: 731.156265100175,
//     usdPrice: 3925.144357
//   }

async function priceSwap(buyTkId, sellTkId, amount) {
    const priceUrl = `https://price.jup.ag/v4/price?ids=${sellTkId}&vsToken=${buyTkId}`;
    const priceResponse = await fetch(priceUrl);
    const priceData = await priceResponse.json();

    const { id, mintSymbol, vsToken, vsTokenSymbol, price } = priceData.data[sellTkId];
  
    const sellQty = amount;
    const buyQty = amount * price;
  
    let usdPrice = price;
    if (vsTokenSymbol !== 'USDC') {
      const usdPriceUrl = `https://price.jup.ag/v4/price?ids=${buyTkId}&vsToken=USDC`;
      const usdPriceResponse = await fetch(usdPriceUrl);
      const usdPriceData = await usdPriceResponse.json();
  
      const buyTokenInUSD = usdPriceData.data[buyTkId].price;
      usdPrice = buyQty * buyTokenInUSD;
    }
  
    return {
      buyTkId,
      buyQty,
      sellTkId,
      sellQty,
      usdPrice
    };
  }

//returns
//   [
//     {
//       buyTkId: 'SOL',
//       buyQty: 5,
//       sellTkId: 'USDC',
//       sellQty: 730.6695307450001,
//       usdPrice: 146.133906149
//     },
//     {
//       buyTkId: 'ETH',
//       buyQty: 0.186275,
//       sellTkId: 'USDC',
//       sellQty: 731.156265100175,
//       usdPrice: 3925.144357
//     }
//   ]

  async function pricePortfolio(portfolio) {
    const prices = await Promise.all(
      portfolio.map((token) => priceSwap(token.id, token.vsToken, token.amount))
    );
    return prices;
  }

// input for swapItem
//     {
//       buyTkId: 'ETH',
//       buyQty: 0.186275,
//       sellTkId: 'USDC',
//       sellQty: 731.156265100175,
//       usdPrice: 3925.144357
//     }
  
  async function createSwapTransactions(swapItems, publicKey){

    console.log('executing swap, on chain', chainId, 'with rpc', RPC);
    // const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY || '')));

    const transactions = await Promise.all(swapItems.map(async (swapItem) => {
        const sellTokenInfo = await getTokenInfo(chainId, swapItem.sellTkId);
        const buyTokenInfo = await getTokenInfo(chainId, swapItem.buyTkId);
    
        console.log({ sellTokenInfo, buyTokenInfo });

    
        //pass in platformFeeBps as a parameter in the quote.
    
        const quoteUrl =`https://quote-api.jup.ag/v6/quote?inputMint=${sellTokenInfo.address}&outputMint=${buyTokenInfo.address}&amount=${swapItem.buyQty * 10 ^ buyTokenInfo.decimals}&slippageBps=50`;
        const quoteResponse = await (await fetch(quoteUrl)).json();
          
        console.log({ quoteResponse });
    
          // get serialized transactions for the swap
            const { swapTransaction } = await (
                await fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    // quoteResponse from /quote api
                    quoteResponse,
                    // user public key to be used for the swap
                    userPublicKey: publicKey.toString(),
                    // auto wrap and unwrap SOL. default is true
                    wrapAndUnwrapSol: true,
                    prioritizationFeeLamports: 'auto'
                    // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
                    // feeAccount: "fee_account_public_key"
                })
                })
            ).json();
    
            console.log({ swapTransaction });
    
    
            // deserialize the transaction
            const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
            var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            console.log(transaction);

            return transaction;
    }));

    console.dir(transactions, { depth: null });
    return transactions;
        // // sign the transaction
        // transaction.sign([wallet.payer]);

        // // Execute the transaction
        // const rawTransaction = transaction.serialize()
        // const signature = await connection.sendRawTransaction(rawTransaction, {
        // skipPreflight: true,
        // maxRetries: 2
        // });
        // console.log("--------------------_>", signature);

        // // const blockheight = await connection.getBlockHeight();

        // // await connection.confirmTransaction(txId);
        // await connection.confirmTransaction({signature, blockhash, lastValidBlockHeight});

        // console.log(`https://solscan.io/tx/${signature}`);
}

async function confirmTransactions(transactions, signature){
    const connection = new Connection(RPC, 'confirmed');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    await Promise.all(transactions.map(async (transaction) => {
        await connection.confirmTransaction({signature, blockhash, lastValidBlockHeight});
    }));
}

async function getTokenInfo(chainId, tokenId) {
    console.log('fetching token info', chainId, tokenId);
    const tokenInfo = await Promise.all(
        await fetch('https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json')
    ).json();
    return tokenInfo.tokens.find((token) => token.chainId === Number(chainId) && token.symbol === tokenId);
}

// async function main(){

//     const swapItem1 = await priceSwap('USDC', 'SOL', 0.1);
//     const swapItem2 = await priceSwap('USDC', 'SOL', 0.11);
//     const swapItem3 = await priceSwap('USDC', 'SOL', 0.12);

//     // console.log(swapItem);

//     await executeSwaps([swapItem1, swapItem2, swapItem3]);


//     // const portfolio = [
//     //     {
//     //         id: 'SOL',
//     //         vsToken: 'USDC',
//     //         amount: 5
//     //     },
//     //     {
//     //         id: 'ETH',
//     //         vsToken: 'USDC',
//     //         amount: 0.186275
//     //     }
//     // ];
//     // const prices = await pricePortfolio(portfolio);
//     // console.log(prices);


// }



// main();


export { priceSwap, pricePortfolio, confirmTransactions, createSwapTransactions};