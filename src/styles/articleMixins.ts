import {
  css,
  type FlattenInterpolation,
  type FlattenSimpleInterpolation,
  type ThemeProps,
} from 'styled-components';

export const articleMixins: Record<
  string,
  FlattenSimpleInterpolation | FlattenInterpolation<ThemeProps<any>>
> = {
  article: css`
    padding: 2rem;
    overflow-wrap: break-word;
    user-select: text;
    margin: 0 auto;
    width: 60rem;
    max-width: 100vw;

    header {
      color: var(--color-text-0);
      margin-bottom: 2rem;

      h1 {
        font: var(--font-extra-book);
        color: var(--color-text-2);
      }
    }

    h2 {
      font: var(--font-large-book);
      color: var(--color-text-2);
      padding: 0.5rem 0;
    }

    h3,
    strong {
      font-weight: 700;
    }

    strong {
      color: var(--color-text-2);
    }

    p {
      padding: 0.5rem 0;
    }

    ul {
      padding: 0.5rem 1rem;
    }
  `,
};
