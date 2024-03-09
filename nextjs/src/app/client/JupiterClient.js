import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import fetch from 'cross-fetch';
import { Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';

//returns
// {
//     buyTkId: 'ETH',
//     buyQty: 0.186275,
//     sellTkId: 'USDC',
//     sellQty: 731.156265100175,
//     usdPrice: 3925.144357
//   }

async function priceSwap(buyTkId, sellTkId, amount) {
    const priceUrl = `https://price.jup.ag/v4/price?ids=${buyTkId}&vsToken=${sellTkId}`;
    const priceResponse = await fetch(priceUrl);
    const priceData = await priceResponse.json();
  
    const { id, mintSymbol, vsToken, vsTokenSymbol, price } = priceData.data[buyTkId];
  
    const buyQty = amount;
    const sellQty = amount * price;
  
    let usdPrice = price;
    if (vsTokenSymbol !== 'USDC') {
      const usdPriceUrl = `https://price.jup.ag/v4/price?ids=${sellTkId}&vsToken=USDC`;
      const usdPriceResponse = await fetch(usdPriceUrl);
      const usdPriceData = await usdPriceResponse.json();
  
      const sellTokenInUSD = usdPriceData.data[sellTkId].price;
      usdPrice = price * sellTokenInUSD;
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
      portfolio.map((token) => fetchPrice(token.id, token.vsToken, token.amount))
    );
    return prices;
  }


  
  async function executeSwap(){
    const connection = new Connection('https://neat-hidden-sanctuary.solana-mainnet.discover.quiknode.pro/2af5315d336f9ae920028bbb90a73b724dc1bbed/');
    const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || '')));
    
    //pass in platformFeeBps as a parameter in the quote.
    const quoteResponse = await (
        await fetch('https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112\
      &outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\
      &amount=100000000\
      &slippageBps=50'
        )
      ).json();
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
                userPublicKey: wallet.publicKey.toString(),
                // auto wrap and unwrap SOL. default is true
                wrapAndUnwrapSol: true,
                // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
                // feeAccount: "fee_account_public_key"
            })
            })
        ).json();


        // deserialize the transaction
        const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
        var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        console.log(transaction);

        // sign the transaction
        transaction.sign([wallet.payer]);

        // Execute the transaction
        const rawTransaction = transaction.serialize()
        const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2
        });
        await connection.confirmTransaction(txid);
        console.log(`https://solscan.io/tx/${txid}`);

}

async function main(){
    // const data = await fetchPrice('SOL','ETH',5);
    // console.log(data);

    // const portfolio = [
    //     {
    //         id: 'SOL',
    //         vsToken: 'USDC',
    //         amount: 5
    //     },
    //     {
    //         id: 'ETH',
    //         vsToken: 'USDC',
    //         amount: 0.186275
    //     }
    // ];
    // const prices = await pricePortfolio(portfolio);
    // console.log(prices);
}

main();


// export { priceSwap, pricePortfolio };