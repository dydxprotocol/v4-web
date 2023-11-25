import { forwardRef } from 'react';

type StyleProps = {
  className?: string;
};

type ElementProps = {
  width: number;
  height: number;
};

export const Canvas = forwardRef<HTMLCanvasElement, ElementProps & StyleProps>(
  ({ className, width, height }, canvasRef) => (
    <canvas ref={canvasRef} className={className} width={width ?? 0} height={height ?? 0} />
  )
);
