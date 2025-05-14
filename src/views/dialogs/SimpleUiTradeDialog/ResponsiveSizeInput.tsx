import { useEffect, useRef, useState } from 'react';

import { USD_DECIMALS } from '@/constants/numbers';
import { DisplayUnit } from '@/constants/trade';

import { Input, InputType } from '@/components/Input';

export const ResponsiveSizeInput = ({
  className,
  inputValue,
  inputType,
  onInput,
  displayableAsset,
  fractionDigits = USD_DECIMALS,
  withResponsiveWidth = true,
  maxFontSize = 52,
  minFontSize = 32,
  inputUnit = DisplayUnit.Fiat,
  placeholder = '0.00',
}: {
  className?: string;
  inputValue: string;
  inputType: InputType;
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
  withResponsiveWidth?: boolean;
  minFontSize?: number;
  maxFontSize?: number;
  inputUnit?: DisplayUnit;
  placeholder?: string;
}) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [fontSize, setFontSize] = useState(maxFontSize);
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
      // Calculate dynamic font size based on input length
      // Start reducing font size after each character
      const newFontSize =
        inputValue.length > 1
          ? Math.max(minFontSize, maxFontSize - (inputValue.length - 1) * 3)
          : maxFontSize;

      setFontSize(newFontSize);

      // Create a hidden span to measure text width
      const span = document.createElement('span');
      span.style.visibility = 'hidden';
      span.style.position = 'absolute';
      span.style.fontSize = `${newFontSize}px`;
      span.style.fontFamily = getComputedStyle(inputRef.current).fontFamily;
      span.style.fontFeatureSettings = getComputedStyle(inputRef.current).fontFeatureSettings;
      span.style.whiteSpace = 'pre';
      span.textContent = inputValue || placeholder;
      document.body.appendChild(span);

      // Set final width within bounds
      const finalWidth = span.offsetWidth;

      document.body.removeChild(span);

      // Set width and font size
      inputRef.current.style.height = `${newFontSize}px`;
      inputRef.current.style.width = `${finalWidth}px`;
      inputRef.current.style.fontSize = `${newFontSize}px`;
    }
  }, [inputValue, windowWidth, withResponsiveWidth, maxFontSize, minFontSize, placeholder]);

  return (
    <div tw="row mx-auto items-start justify-center">
      {inputUnit === DisplayUnit.Fiat && (
        <span
          tw="ml-auto text-color-text-0 font-large-book"
          css={{ fontSize: `${Math.max(fontSize * 0.5, 18)}px` }}
        >
          $
        </span>
      )}
      <Input
        className={className}
        ref={inputRef}
        tw="w-auto max-w-[80vw] bg-[transparent] text-right caret-color-accent focus:outline-none"
        value={inputValue}
        placeholder={placeholder}
        type={inputType}
        onInput={onInput}
        decimals={fractionDigits}
        css={{
          transition: 'width 0.1s ease-out, font-size 0.1s ease-out',
        }}
      />
      {inputUnit === DisplayUnit.Asset && (
        <span
          tw="mr-auto text-color-text-0 font-large-book"
          css={{ fontSize: `${Math.max(fontSize * 0.5, 18)}px` }}
        >
          {displayableAsset}
        </span>
      )}
    </div>
  );
};
