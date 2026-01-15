import type { FC } from 'react';
import * as css from './DashboardHeader.css';

type DashboardHeaderProps = {
  title: string;
  subtitle: string;
};

export const DashboardHeader: FC<DashboardHeaderProps> = (props) => {
  return (
    <div css={css.header}>
      <h1 css={css.title}>{props.title}</h1>
      <p css={css.subtitle}>{props.subtitle}</p>
    </div>
  );
};
