import { useEffect, useRef, useState } from 'react';

import { USD_DECIMALS } from '@/constants/numbers';
import { DisplayUnit } from '@/constants/trade';

import { Input, InputType } from '@/components/Input';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedDisplayUnit } from '@/state/appUiConfigsSelectors';

export const ResponsiveSizeInput = ({
  inputValue,
  onInput,
  displayableAsset,
  fractionDigits = USD_DECIMALS,
}: {
  inputValue: string;
  onInput: ({
    value,
    floatValue,
    formattedValue,
  }: {
    value: string;
    floatValue?: number;
    formattedValue: string;
  }) => void;
  displayableAsset: string;
  fractionDigits?: number;
}) => {
  const displayUnit = useAppSelector(getSelectedDisplayUnit);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [fontSize, setFontSize] = useState(52); // Initial font size in pixels
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for window resize events
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Adjust input width and font size based on content and window width
  useEffect(() => {
    if (inputRef.current) {
      // Default width when empty
      const minWidth = 100;

      // Calculate maximum width (70% of window width)
      const maxWidth = windowWidth * 0.7;

      // Calculate dynamic font size based on input length
      // Start reducing font size after 6 characters
      const newFontSize =
        inputValue.length > 6 ? Math.max(32, 52 - (inputValue.length - 6) * 3) : 52;

      setFontSize(newFontSize);

      // Create a hidden span to measure text width
      const span = document.createElement('span');
      span.style.visibility = 'hidden';
      span.style.position = 'absolute';
      span.style.fontSize = `${newFontSize}px`;
      span.style.fontFamily = getComputedStyle(inputRef.current).fontFamily;
      span.style.whiteSpace = 'pre';

      // Use placeholder if input is empty
      span.textContent = inputValue || '0.00';

      document.body.appendChild(span);
      // Limit the width to maxWidth
      const textWidth = Math.min(maxWidth, Math.max(minWidth, span.offsetWidth + 20)); // Add padding
      document.body.removeChild(span);

      // Set width and font size
      inputRef.current.style.width = `${textWidth}px`;
      inputRef.current.style.fontSize = `${newFontSize}px`;
    }
  }, [inputValue, windowWidth]);

  return (
    <div tw="row mx-auto items-start justify-center">
      {displayUnit === DisplayUnit.Fiat && (
        <span tw="mt-0.75 text-color-text-2 font-large-book">$</span>
      )}
      <Input
        ref={inputRef}
        tw="h-[4.375rem] w-auto min-w-[100px] bg-[transparent] text-right caret-color-accent focus:outline-none"
        value={inputValue}
        placeholder="0.00"
        type={InputType.Number}
        onInput={onInput}
        decimals={fractionDigits}
        css={{
          transition: 'width 0.1s ease-out, font-size 0.1s ease-out',
        }}
      />
      {displayUnit === DisplayUnit.Asset && (
        <span
          tw="mt-0.75 text-color-text-2 font-large-book"
          style={{ fontSize: `${Math.max(fontSize * 0.46, 18)}px` }}
        >
          {displayableAsset}
        </span>
      )}
    </div>
  );
};
