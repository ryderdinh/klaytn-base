import { getDefaultConfig } from 'connectkit'
import { configureChains, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { infuraProvider } from 'wagmi/providers/infura'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'

import { klaytnChain } from './customChains'

const { publicClient, chains } = configureChains(
	[klaytnChain, mainnet],
	[
		infuraProvider({ apiKey: process.env.REACT_APP_INFURA_ID }),
		jsonRpcProvider({
			rpc: chain => {
				console.log(true, chain)
				if (chain.id !== klaytnChain.id) return null
				return { http: chain.rpcUrls.default.http }
			}
		})
	]
)

const initWagmiConfig = getDefaultConfig({
	// Required API Keys
	chains,
	publicClient,
	infuraId: process.env.REACT_APP_INFURA_ID,
	walletConnectProjectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID,
	// Required
	appName: 'Klaytn',
	// Optional
	appDescription: 'Your App Description',
	appUrl: 'https://games.eraprotocol.io/', // your app's url
	appIcon: 'https://rofi-game-01.b-cdn.net/eragames/era-logo.svg' // your app's icon, no bigger than 1024x1024px (max. 1MB)
})

const initConnector = () => {
	let newConnector = [...initWagmiConfig.connectors]
	newConnector.splice(1, 1)
	newConnector[1] = new WalletConnectConnector({
		chains,
		options: {
			projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID,
			showQrModal: false
		}
	})
	console.log(chains, newConnector[1])
	return newConnector
}

const wagmiConfig = createConfig({
	...initWagmiConfig,
	connectors: initConnector()
})

export default wagmiConfig