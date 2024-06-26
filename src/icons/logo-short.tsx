import { useAppThemeAndColorModeContext } from '@/hooks/useAppThemeAndColorMode';

export const LogoShortIcon: React.FC<{ id?: string }> = ({ id }: { id?: string }) => {
  const theme = useAppThemeAndColorModeContext();
  const fill = theme.logoFill;

  return (
    <svg
      width="135"
      height="145"
      viewBox="0 0 135 145"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M100.986 0L0 144.988H31.0048L132.514 0H100.986Z" fill={fill} />
      <path
        d="M34.2346 0L63.9475 42.7232L48.4451 66.0268L2.58386 0H34.2346Z"
        fill={`url(#${id ? `${id}_logo_gradient_0` : 'paint0_linear'})`}
      />
      <path
        d="M103.995 145L71.0526 97.7455L86.555 75.0893L135 145H103.995Z"
        fill={`url(#${id ? `${id}_logo_gradient_1` : 'paint1_linear'})`}
      />
      <defs>
        <linearGradient
          id={id ? `${id}_logo_gradient_0` : 'paint0_linear'}
          x1="27.1293"
          y1="9.0625"
          x2="69.773"
          y2="60.4324"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={fill} />
          <stop offset="1" stopColor={fill} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient
          id={id ? `${id}_logo_gradient_1` : 'paint1_linear'}
          x1="111.1"
          y1="133.996"
          x2="58.6959"
          y2="63.4999"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6966FF" />
          <stop offset="1" stopColor="#6966FF" stopOpacity="0.36" />
        </linearGradient>
      </defs>
    </svg>
  );
};
