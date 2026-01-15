import type { FC, HTMLAttributes } from 'react';
import * as css from './Card.css';

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card: FC<CardProps> = ({ children, ...props }) => {
  return (
    <div css={css.card} {...props}>
      {children}
    </div>
  );
};
