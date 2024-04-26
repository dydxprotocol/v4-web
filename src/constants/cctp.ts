import cctpTokens from '../../public/configs/cctp.json';

const CCTP_MAINNET_CHAINS = cctpTokens.filter((token) => !token.isTestnet);
const CCTP_MAINNET_CHAINS_NAMES_LOWER_CASE = CCTP_MAINNET_CHAINS.map((token) =>
  token.name.toLowerCase()
);

// TODO: make a general capitalize util fn
export const CCTP_MAINNET_CHAIN_NAMES_CAPITALIZED = CCTP_MAINNET_CHAINS_NAMES_LOWER_CASE.map(
  (tokenName) => tokenName[0].toUpperCase() + tokenName.slice(1)
);
