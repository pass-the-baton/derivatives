import React from "react";
import { ChainId, DAppProvider, Config } from "@usedapp/core";
import "./App.css";
import Mint from "./Mint";

const config: Config = {
  readOnlyChainId: ChainId.Mainnet,
  readOnlyUrls: {
    [ChainId.Mainnet]:
      process.env.WEB3_API ||
      "https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY",
  },
};

function App() {
  return (
    <DAppProvider config={config}>
      <div className="App">
        <header className="App-header">
          <Mint />
        </header>
      </div>
    </DAppProvider>
  );
}

export default App;
