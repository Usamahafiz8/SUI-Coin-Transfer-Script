import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import dotenv from "dotenv";
import { SUI_NETWORK, getSigner } from "./config";

dotenv.config();

const client = new SuiClient({
  url: SUI_NETWORK,
});

export async function getWalletAddress(): Promise<string> {
  const signer = await getSigner();
  const address = signer.getPublicKey().toSuiAddress();
  console.log("Wallet Address:", address);
  return address;
}

export async function getWalletBalance(): Promise<string> {
  try {
    const address = await getWalletAddress();
    const balance = await client.getBalance({
      owner: address,
      coinType: "0x2::sui::SUI",
    });
    const suiBalance = (Number(balance.totalBalance) / 1e9).toFixed(2);
    console.log("Wallet Balance:", suiBalance, "SUI");
    return balance.totalBalance;
  } catch (error: unknown) {
    console.error("Error fetching balance:", error);
    throw error;
  }
}

export async function sendSui(recipients: { to: string; amount: bigint }[]): Promise<string[]> {
  try {
    const signer = await getSigner();
    const sender = signer.getPublicKey().toSuiAddress();

    const tx = new Transaction();

    // Split coins for each recipient
    const amounts = recipients.map((r) => tx.pure.u64(r.amount));
    const coins = tx.splitCoins(tx.gas, amounts);

    // Transfer each coin to its respective recipient
    recipients.forEach((recipient, index) => {
      tx.transferObjects([coins[index]], tx.pure.address(recipient.to));
    });

    // Set gas budget (increase if needed for multiple transfers)
    tx.setGasBudget(10000000 * recipients.length); // Adjust based on number of recipients

    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: signer,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });

    if (result.effects?.status.status !== "success") {
      throw new Error("Transaction failed");
    }

    console.log("✅ Transaction successful!");
    console.log("🎯 Digest:", result.digest);
    console.log("🧾 Status:", result.effects?.status);
    return [result.digest]; // Single digest for the entire transaction
  } catch (error: unknown) {
    console.error("❌ Error sending SUI:", (error as Error).message);
    throw error;
  }
}

// Wallet addresses
const wallets = {
  Dbenzman: "0x88a47f234f5b8ba627cac50cd0505a9eccb947b15de2f72f4237414a176e9fe1",
  JAKE: "0x1bfdbdf86835bdb6d00cfeabcda1c59287a7bef1b81c08c5bbe30c13fdfb87d3",
  RatnaTus79: "0xbc3facf679444a0119f813c8e4e1c35d64882b36e874599eea6d007214a946e3",
  OllManE33: "0xe6582a6e9d4bf4a143a32ad3374ff2d58cc500545c3775ed5806c56dd3d63b29",
  Dinidini: "0xbc7779db416af7af3fabbd5377bbfae99304708cb13e0155802a854059c1f307",
};

(async (): Promise<void> => {
  try {
    // Check initial balance
    await getWalletBalance();

    // Define recipients and amounts
    const recipients = [
      { to: wallets.Dbenzman, amount: BigInt(Math.floor(10.00 * 1e9)) },
      { to: wallets.JAKE, amount: BigInt(Math.floor(10.00 * 1e9)) },
      { to: wallets.RatnaTus79, amount: BigInt(Math.floor(10.00 * 1e9)) },
      { to: wallets.OllManE33, amount: BigInt(Math.floor(10.00 * 1e9)) },
      { to: wallets.Dinidini, amount: BigInt(Math.floor(10.00 * 1e9)) },
    ];

    const digests = await sendSui(recipients);
    console.log("Airdrop completed for recipients:");
    recipients.forEach((r) => console.log(` - ${r.to}: ${r.amount / BigInt(1e9)} SUI`));
    console.log("Transaction digests:", digests);

    // Check final balance
    await getWalletBalance();
  } catch (error: unknown) {
    console.error("Airdrop failed:", error);
  }
})();