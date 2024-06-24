import { TWITTER_BASE_URL } from '@/constants/twitter';

export interface TwitterIntent {
  text: string;
  related?: string;
}

export const triggerTwitterIntent = (props: TwitterIntent) => {
  const { text, related } = props;
  const twitterIntent = new URL('intent/tweet', TWITTER_BASE_URL);
  twitterIntent.searchParams.append('text', text);

  if (related) {
    twitterIntent.searchParams.append('related', related);
  }

  window.open(twitterIntent, '_blank');
};
