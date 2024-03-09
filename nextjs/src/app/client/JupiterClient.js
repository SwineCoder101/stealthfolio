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
      usdPrice = price * buyTokenInUSD;
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

// async function main(){
//     const data = await fetchPrice('SOL','ETH',5);
//     console.log(data);

//     const portfolio = [
//         {
//             id: 'SOL',
//             vsToken: 'USDC',
//             amount: 5
//         },
//         {
//             id: 'ETH',
//             vsToken: 'USDC',
//             amount: 0.186275
//         }
//     ];
//     const prices = await pricePortfolio(portfolio);
//     console.log(prices);
// }

// main();


export { priceSwap, pricePortfolio };