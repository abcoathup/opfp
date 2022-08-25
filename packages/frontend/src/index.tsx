import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.scss'
import { BrowserRouter } from 'react-router-dom'
import { Mainnet, DAppProvider, Config, Goerli, Optimism } from '@usedapp/core'
import { getDefaultProvider } from 'ethers'

import App from './App'
import reportWebVitals from './reportWebVitals'

const config: Config = {
  readOnlyChainId: Mainnet.chainId,
  readOnlyUrls: {
    [Mainnet.chainId]: getDefaultProvider('mainnet'),
    [Optimism.chainId]: getDefaultProvider('optimism'),
    [Goerli.chainId]: getDefaultProvider('goerli'),
  },
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <DAppProvider config={config}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </DAppProvider>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
