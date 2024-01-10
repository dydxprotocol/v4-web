import { forwardRef } from 'react';

type CanvasProps = {
  className?: string;
  width: number | string;
  height: number | string;
};

export const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
  ({ className, width, height }, canvasRef) => (
    <canvas ref={canvasRef} className={className} width={width ?? 0} height={height ?? 0} />
  )
);
