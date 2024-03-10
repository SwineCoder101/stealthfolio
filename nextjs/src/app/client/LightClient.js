import * as light from '@lightprotocol/zk.js'
import * as anchor from "@coral-xyz/anchor";
​
// Configure testing environment
let rpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC;

// const provider = anchor.AnchorProvider.local(
//   rpcUrl,
//   light.confirmConfig
// );
​
const provider = await light.Provider.init({
    wallet: solanaWallet,
    relayer: testRelayer,
    confirmConfig
  });

const user = await light.User.init({ provider });


// Create a random recipient publicKey
const testRecipientPublicKey = new light.account().getPublicKey();


// Execute the transfer
const response = await user.transfer({
  amountSol: '0.1',
  token: 'SOL',
  recipient: testRecipientPublicKey,
});

// We can check the transaction that gets executed on-chain and won't
// see any movement of tokens, whereas our user's private balance changed!
console.log(response.txHash);
console.log(await user.getBalance());



const main = async () => {
​
  // Replace this with your user's Solana wallet
  const solanaWallet = anchor.web3.Keypair.generate()
  
  // We want to shield SOL, so let's airdrop some public test tokens 
  // to the user's Solana wallet.
  await light.airdropSol({
    connection: provider.connection,
    recipientPublicKey: solanaWallet.publicKey,
    lamports: 1e9,
  });

    // The relayer that will execute the transfer later
    const testRelayer = new TestRelayer({
        relayerPubkey: solanaWallet.publicKey,
        relayerRecipientSol: solanaWallet.publicKey,
        relayerFee: new BN(100_000),
        payer: solanaWallet,
      });
    ​
    }
    ​
    main();