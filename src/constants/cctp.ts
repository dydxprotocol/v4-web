import cctpTokens from '../../public/configs/cctp.json';

const CCTP_CHAIN_NAMES_LOWER_CASE = cctpTokens.map((token) => token.name.toLowerCase());

const CCTP_MAINNET_CHAIN_NAMES = CCTP_CHAIN_NAMES_LOWER_CASE.filter(
  (name) => name === 'Ethereum Goerli'
);

// TODO: make a general capitalize util fn
export const CCTP_MAINNET_CHAIN_NAMES_CAPITALIZED = CCTP_MAINNET_CHAIN_NAMES.map(
  (tokenName) => tokenName[0].toUpperCase() + tokenName.slice(1)
);
