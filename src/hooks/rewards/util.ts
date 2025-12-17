export function pointsToEstimatedDydxRewards(
  points?: number,
  totalPoints?: number,
  dydxPrice?: number,
  totalUsdRewards?: number
) {
  if (!totalPoints || !dydxPrice || !totalUsdRewards || points === undefined) return '-';
  const usdRewards = (points / totalPoints) * totalUsdRewards;
  return usdRewards / dydxPrice;
}

export function pointsToEstimatedDollarRewards(
  points?: number,
  totalPoints?: number,
  totalUsdRewards?: number
) {
  if (!totalPoints || !totalUsdRewards || points === undefined) return undefined;
  return (points / totalPoints) * totalUsdRewards;
}

export function feesToEstimatedDollarRewards(totalFees?: number): number {
  if (!totalFees) return 0;
  return totalFees * 0.5;
}

// Move to Chaos Labs query once its available
export const CURRENT_SURGE_REWARDS_DETAILS = {
  season: 9,
  rewardAmount: '',
  rewardAmountUsd: 0,
  rebatePercent: '50%',
  rebatePercentNumeric: '50',
  rebateFraction: 0.5,
  endTime: '2025-12-31T23:59:59.000Z', // end of month
};

export const DEC_2025_COMPETITION_DETAILS = {
  rewardAmount: '$1M',
  rewardAmountUsd: 1_000_000,
  endTime: '2025-12-31T23:59:59.000Z', // end of month
  claimStartTime: '2025-12-19T23:59:00.000Z', // proposal passes + a few hours for any changes to claim page
  claimEndtime: '2026-01-31T23:59:59.000Z', // end of jan
  estimatedWalletRewards: {
    dydx18scsz5rdh242lnlnsgwxu5f5pmtf8cqw0pl58c: '5775.42',
    dydx17vt04dtfau0hvm0v6ahx708lflpgg4gedfqsyh: '5132.79',
    dydx10hpl83hamwz0pxvjlanh5rcas3mdgf8xk7g7ra: '4963.81',
    dydx17tch34sk5gzmn92zc5srwjngqgfqxcfex9339j: '4478.60',
    dydx1hyfm837du0zzn2pw0r328q7nl07c0um7u207ge: '4156.27',
    dydx1jxe3l4h2ychf66q5f37qxfpx2jh6l3zjum39rz: '2849.81',
    dydx13aeza8l3mrcr8d34g9z8tcunncl74gprf7t98g: '2797.10',
    dydx1a3ggqr30aduu4nhf92xxv8zqceczqdsg078lk4: '2667.30',
    dydx10yeumv4mdfre68g3tcf03nlr9y4rlsn4uss4uf: '2271.06',
    dydx1c4snkv9kac768m7dcxygjh6vqysmhyycj5f9t4: '2016.15',
    dydx1ufs97x7psym2735x7sfksdrsux63wzjfzfvpwd: '1901.04',
    dydx1hsest59cpjhzlpslwdsjmvwapjyd0cfthmn3ja: '1893.51',
    dydx1qmx0way5kd9umj9vgsyeg4e2sh9m3s293mpgq9: '1853.91',
    dydx179gwlz4fx20dntagmyzgu2uem5f95ej05qzpse: '1794.80',
    dydx1t9hd44tz6rh5ah7ljcyp99053rpymwm5fw4f53: '1715.40',
    dydx1zug353eq708ycmx5m8wp2ldj5nwfusl3kz2svk: '1646.83',
    dydx146keskm02u7hkqc6v6nvq3f8slavrytwpks6zz: '1625.57',
    dydx1n76jumjapfqkpnyqgvvqcv8762m06k4yl6cr5y: '1491.74',
    dydx1za0zs4stp65vll2nmh26qualq0uj6thh7ryyxc: '1429.89',
    dydx1kh9rhnyjmh6h4dpzpxqfcsc3dhmzwpz9myu7ev: '1314.07',
    dydx1qnulemnmyrm2rv2u3y6nfq379kldjza8qxgcga: '1279.73',
    dydx1afr2uvufcw4qwr4k9le2g8yxughnztncm3j5v9: '1168.91',
    dydx1axv8uda4c8ryz9e5gyx7hc3vz4ptmr6gmn67jw: '1161.17',
    dydx1y92j8l9nmnx8htjx3f9jec4eg4xzlepreg5xa5: '1156.29',
    dydx1uj5cywf4jyenrelkdtd7zwunzpumdu9j3tysqf: '1132.76',
    dydx10gtrjmf0qsutgrlsc32qwv6dq4v8xwqdcameyl: '1121.41',
    dydx1wyhxdz7aej4ze80f3szmdveufz56zanhv6ej7t: '1077.78',
    dydx1h0xansqzvhs2th9m7cdn5r6e52tkwvxrxp9yuf: '1063.53',
    dydx1f3l724ezg3m9eykkyem6xamguqyf434ptzpkda: '975.78',
    dydx19vs0ys95hauyu6yejdkt59rvungn9z8zj6l8kt: '962.23',
    dydx10wv0ur56cq3wyk5v58cjnux4745xc85fe7uurj: '935.56',
    dydx1xg9c2jj7z07krwsfz3njc5gnwcmwfqxcjwl6tw: '928.88',
    dydx14mlqzx6v5ajmerfqwmeu2asr32a0qs2dfc5970: '915.44',
    dydx19v3y45yas9k0k9qzv3pqmwdzusgrlxev6t45fj: '867.28',
    dydx16y908xy4pg2q07a8ydfzxwcryy8uzwt044uvu0: '853.66',
    dydx18023tv2kw8c03us8nl77ma00466zqqzgzh7l6y: '828.14',
    dydx1878e4s67ura0l5mp4zesz6ghkcr4u232zhfcy4: '811.61',
    dydx1qlnpjgqhdfca54gjrute88estqwz7mchffyawk: '806.79',
    dydx1lh75k0str8nxgwgrd2xwx440l38ds9ur0ek67e: '801.82',
    dydx176txwnwps6shutxl0jwlv9p4vhdasmp3fm6s4e: '795.8',
    dydx1klkt566wcz4hel793gah0t43lqlpqwg04h8uhf: '767',
    dydx1m4mc4dsvdf3q7jpa5kgpz2w86wykfqergfmc5v: '728.8',
    dydx15uh9tkcht0nvx0n8rqnqd2ky05xkrnmd7un972: '700.21',
    dydx1jfl3c74shcqpq7kvaa6ac7g3pmg2warlrfa2mk: '676.2',
    dydx19hzvjn9nsmafz2ua63hr6r0v609unvyxf4tu96: '665.19',
    dydx1vstyyprk2xtrfe8ealw3wrqt9rgfs9rx9ztfvp: '660.93',
    dydx1qgx5mhzxmtpvadmcgdq5ytmll5hq6truy9rfq6: '651.18',
    dydx1keelhggvqu9qley30qx9s8evu4f9jznxugh5pn: '635.65',
    dydx142v4mv2ng6ejxd8anx7a93p5tx8md5mqgz6nqj: '607.89',
    dydx12g8fjey35weu7ef8q2lnakmpqkw5avpxszxuy4: '594.54',
    dydx1rng56c8lg2ggdpav004as9mh5aft9v9fnw73j5: '593.91',
    dydx14jk68rhpjrlquupvdystfzw2snf7v43qscanqt: '580.64',
    dydx12p4z697emcxra05tu0t27ayj33y5tcpx2zq68n: '579.98',
    dydx1mefa0n6j58zvxpva0c4na8rgm5rf6sj9wr6xdl: '573.68',
    dydx1cdh7lg5awsxdgc2gvm26k8ut8f5nflrw55dzcg: '570.6',
    dydx1fq359sn2y7waawamk28t0k3wgkucz25njzm3tc: '567.4',
    dydx163s0g5a0f4x8264w5nx2qear06ffe3w45dcv5u: '550.08',
    dydx1s4fquxtzlvfumqfhvjlln23gzvxunasdcamuat: '527.11',
    dydx1yrne3cadvch3hju8at5k4tn9xp98z4hgkzyhj5: '519.42',
    dydx1x89rwrgsd287j8nyrk084c2rqwxv9zxypv7nht: '496.3',
    dydx1u98rum2e3plmvwugegcnge6st4pvxpu2ccsvwe: '489.22',
    dydx1wdm2vfjzqjn2k37n86aqz7ccf5qpdpwj5serjr: '487.1',
    dydx1xa8vpn0e9gjfhaqhnl06rjhjngg54mywk0aax8: '470.22',
    dydx1m4v5r5s9t2m3ukm35shcn84rrkzrv4u8k7dnq7: '465.87',
    dydx1zqgese9vvr338c2c63f27gwcg9h8npsstnvsda: '452.12',
    dydx1jfueucq6qg4avnjev0vd2nvtg0rdcl4lvgsr5g: '449.09',
    dydx14g8gtj52dgtpv5x4k03u7qlnmw2guyy6j3rwgf: '447.53',
    dydx13rysc2grgj8kt8yys6ylm03n9chpwktvx9rcsd: '443.57',
    dydx14r34ern0duvaerpypl6lh0lyeesa5454hr5ctr: '441.64',
    dydx1qcslanrp92v7r37w9qx867l5lghk5r5yfc5ajy: '430',
    dydx1vgl5r7shzlx4s026jvsyyld4v5lz98alwe5xtd: '427.12',
    dydx1fs456vxznh5ajpqwa59x4etzv0tq6eg6asq0ls: '410.4',
    dydx1ra8x3ktlynukrtwcy3wvmpsujk98nyz5e4nheu: '394.26',
    dydx1jqqp3pc6se96g2kecxgkaz0j7umx5j0y08ypgh: '393.09',
    dydx1lhhmnthgd4shjkkxepzgjv3n9fpcjw7cjn2xgy: '388.89',
    dydx19gvq2407chnwy0qz7ra83cktfymnwy0nn08puz: '378.6',
    dydx1sdx3cdcvkvygkq24tcsa9z2z4lkszfu44q0lgs: '372.29',
    dydx1rr2q3dm02dpagddyj2fklgn78094sdpt9hldh4: '366.25',
    dydx1clczqvzdcvdhh4qn4vl4n5wwnnnyru8mq5egwm: '350.11',
    dydx12tpalgc2hm8k8xg2j3nvuf3q5qkmrj7sus2xzf: '343.63',
    dydx1kupl5q5kjfkxdlgz27afshqe6anmkgtjdnw5va: '334.28',
    dydx1vk0h00qqzfvw9kdjsywxlatk985a497krmh5hj: '332.01',
    dydx10pqape76uwew0na3xrdxwnjam5qwzc04h79l0m: '328.77',
    dydx1xd9qtmu35kp6yrhqkktq84hvq88lmn65mp75pj: '326.59',
    dydx16ca2dg7y477zyrw0demqsse3stesud7val6dk9: '323.42',
    dydx1vd27pygl6y4qndpmd4hc86fqvdj7tj4hhf6hee: '322.14',
    dydx1gch3w7yu2cp97gsukx4ludfn8stwdk50gcf65d: '319.44',
    dydx1270ufzkufkkp4l922zltjf5g9rlufupl748lr2: '317.61',
    dydx1u4kprlmrhdxzn663p6gsjf5sq3jsfus9n399u9: '315.2',
    dydx1gmmyuv4ttzgduj6zpxtsnemvfa5gr6ca4cmcj2: '298.93',
    dydx1ga7aqlv9ll765v0pqtzcspmvg9xgxgj3kjvpss: '294.07',
    dydx1k9a76t62p6dv0wrkc4fg8vkrjtkv6ssfjg5l5e: '287.96',
    dydx1mf5myafs9vtt0erqpnfrk447g5fd5aa4sqx9t8: '282.46',
    dydx1ww3e3s59vvca0lfkw97nnwzt4sed5a59zmg77l: '281.78',
    dydx19rpqpy7hf3zs7z0c0urd7es0qk3rq8dlsplptl: '270.88',
    dydx177r48xzlzys8r3nz0kyelurul65xhw09p2cmp9: '267.89',
    dydx17qvwdpdljavs8ksg89pdjuqf3nmzdu6x92wst9: '262.57',
    dydx18zswqnds6ctwhm05vf2nfv3edw0kdkwf8u4fdh: '256.9',
    dydx1k36d0u3s9670yuphwcaem9f3k8zkhxa50xhhz8: '256.15',
    dydx1w26nye5g2psq8edhj3ch99tc0p4qkv3kvcdnkx: '253.61',
  } as Record<string, string>,
};
