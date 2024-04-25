import cctpTokens from '../../public/configs/cctp.json';

export const CCTP_CHAIN_NAMES_LOWER_CASE = cctpTokens.map((token) => token.name.toLowerCase());

// TODO: make a general capitalize util fn
export const CCTP_CHAIN_NAMES_CAPITALIZED = CCTP_CHAIN_NAMES_LOWER_CASE.map(
  (tokenName) => tokenName[0].toUpperCase() + tokenName.slice(1)
);
