import typia from 'typia';

type NobleIbcMsg = {
  source_port: string;
  source_channel: string;
  token: {
    denom: string;
    amount: string;
  };
  sender: string;
  receiver: string;
  timeout_height: any; // This is usually an empty object but Skip may return something here.
  timeout_timestamp: number;
};

export const isNobleIbcMsg = typia.createAssert<NobleIbcMsg>();
