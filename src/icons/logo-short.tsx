import Logo from '@/icons/logos/logo.png';

export const LogoShortIcon: React.FC<{ id?: string; width?: number; height?: number }> = ({
  id,
  width = 179,
  height = 204,
}: {
  id?: string;
  width?: number;
  height?: number;
}) => {
  return (
    <div
      id={id}
      className="ml-1 flex aspect-square h-auto w-full flex-row items-start justify-center overflow-hidden object-center"
    >
      <img
        src={Logo}
        alt="Bonk"
        width={width}
        height={height}
        className="h-full w-auto object-contain"
      />
    </div>
  );
};
