import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import type { NumberFormatValues } from 'react-number-format';
import styled from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { Output, OutputType } from '@/components/Output';
import { ToggleGroup } from '@/components/ToggleGroup';
import { WithConfirmationPopover } from '@/components/WithConfirmationPopover';

enum EditorState {
  Viewing = 'Viewing',
  Selecting = 'Selecting',
  Editing = 'Editing',
}

type ElementProps = {
  slippage: number;
  setIsEditing?: Dispatch<SetStateAction<boolean>>;
  setSlippage: (slippage: number) => void;
  disabled?: boolean;
};

export type SlippageEditorProps = ElementProps;

export const SlippageEditor = ({
  disabled,
  slippage,
  setIsEditing,
  setSlippage,
}: SlippageEditorProps) => {
  const percentSlippage = slippage * 100;
  const [slippageInputValue, setSlippageInputValue] = useState(percentSlippage.toString());
  const [editorState, setEditorState] = useState(EditorState.Viewing);

  const stringGetter = useStringGetter();

  const toggleGroupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsEditing?.(editorState !== EditorState.Viewing);

    if (editorState === EditorState.Selecting) {
      // use setTimeout with a 0ms delay to focus asynchronously.
      setTimeout(() => toggleGroupRef?.current?.focus(), 0);
    } else if (editorState === EditorState.Editing) {
      inputRef?.current?.focus();
    } else if (editorState === EditorState.Viewing) {
      /* empty */
    }
  }, [editorState]);

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditorState(EditorState.Viewing);
    }
  };

  const onCancel = () => {
    setEditorState(EditorState.Viewing);
    setSlippageInputValue(percentSlippage.toString());
  };

  const onChangeSlippage = ({ value }: NumberFormatValues) => {
    setSlippageInputValue(value);
  };

  const onConfirmSlippage = () => {
    setEditorState(EditorState.Viewing);
    setSlippage(Number(slippageInputValue) / 100);
  };

  const onSelectSlippage = (newSlippage: string) => {
    if (newSlippage === 'custom') {
      setEditorState(EditorState.Editing);
    } else {
      setSlippage(Number(newSlippage));

      setEditorState(EditorState.Viewing);
    }
  };

  if (disabled) {
    return <Output type={OutputType.Percent} value={slippage} />;
  }

  return (
    <$WithConfirmationPopover
      open={editorState !== EditorState.Viewing}
      onOpenChange={onOpenChange}
      align="end"
      sideOffset={-22}
      asChild
      onCancel={onCancel}
      onConfirm={editorState === EditorState.Editing ? onConfirmSlippage : undefined}
      slotTrigger={
        <$SlippageOutput onClick={() => setEditorState(EditorState.Selecting)}>
          <Output type={OutputType.Percent} value={slippage} />
          <Icon iconName={IconName.Pencil} />
        </$SlippageOutput>
      }
    >
      {
        {
          [EditorState.Viewing]: undefined,
          [EditorState.Selecting]: (
            <$SlippageInput>
              <ToggleGroup
                ref={toggleGroupRef}
                items={[
                  { label: '0.1%', value: '0.001' },
                  { label: '0.25%', value: '0.0025' },
                  { label: stringGetter({ key: STRING_KEYS.CUSTOM }), value: 'custom' },
                ]}
                value={slippage.toString()}
                onValueChange={onSelectSlippage}
                shape={ButtonShape.Rectangle}
                size={ButtonSize.XSmall}
              />
            </$SlippageInput>
          ),
          [EditorState.Editing]: (
            <$FormInput
              type={InputType.Percent}
              value={slippageInputValue}
              ref={inputRef}
              onChange={onChangeSlippage}
              max={100}
            />
          ),
        }[editorState]
      }
    </$WithConfirmationPopover>
  );
};
const $SlippageOutput = styled.button`
  ${layoutMixins.row}
  text-decoration: underline;
  gap: 0.5ch;
`;

const $WithConfirmationPopover = styled(WithConfirmationPopover)`
  font-size: 0.625rem;
  width: 10rem;
`;

const $SlippageInput = styled.div`
  ${layoutMixins.inlineRow}

  justify-content: center;
  background-color: var(--color-layer-2);
  border-radius: 0.5em;
`;

const $FormInput = styled(FormInput)`
  --form-input-height: 1.5rem;

  input {
    text-align: end;
  }
`;
