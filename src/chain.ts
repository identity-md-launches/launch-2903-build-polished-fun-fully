import { createConfig, http } from 'wagmi';
import { coinbaseWallet } from 'wagmi/connectors/coinbaseWallet';
import { injected } from 'wagmi/connectors/injected';
import { sepolia } from 'viem/chains';

export const PUBLIC_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
export const config = createConfig({
  chains: [sepolia],
  multiInjectedProviderDiscovery: true,
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Squeek Arena', appLogoUrl: new URL(`${import.meta.env.BASE_URL}favicon.svg`, location.href).href }),
  ],
  transports: { [sepolia.id]: http(PUBLIC_RPC, { timeout: 10_000, retryCount: 1 }) },
});
