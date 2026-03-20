export let tradingEnabled = true;
export let currentRound: 1 | 2 | 3 | null = null;

export const setTradingEnabled = (v: boolean): void => {
  tradingEnabled = v;
};

export const setCurrentRound = (r: 1 | 2 | 3 | null): void => {
  currentRound = r;
};
