import styled from 'styled-components';

import { TradeBoxDialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { ClosePositionForm } from '@/views/forms/ClosePositionForm';
import { SelectMarginModeForm } from '@/views/forms/SelectMarginModeForm';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { closeDialogInTradeBox, openDialogInTradeBox } from '@/state/dialogs';
import { getActiveTradeBoxDialog } from '@/state/dialogsSelectors';

import abacusStateManager from '@/lib/abacus';

import { TradeBoxOrderView } from './TradeBoxOrderView';

export const TradeBox = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const activeDialog = useAppSelector(getActiveTradeBoxDialog);

  const activeDialogConfig =
    activeDialog &&
    TradeBoxDialogTypes.match<{ title: string; content: JSX.Element; onClose?(): void }>(
      activeDialog,
      {
        SelectMarginMode: () => ({
          title: stringGetter({ key: STRING_KEYS.MARGIN_MODE }),
          content: (
            <SelectMarginModeForm onChangeMarginMode={() => dispatch(closeDialogInTradeBox())} />
          ),
        }),
        ClosePosition: () => ({
          title: stringGetter({ key: STRING_KEYS.CLOSE_POSITION }),
          content: (
            <ClosePositionForm onClosePositionSuccess={() => dispatch(closeDialogInTradeBox())} />
          ),
          onClose: () => {
            abacusStateManager.clearClosePositionInputValues({ shouldFocusOnTradeInput: true });
          },
        }),
      }
    );

  return (
    <$TradeBox>
      <TradeBoxOrderView />

      <$Dialog
        isOpen={!!activeDialog}
        title={activeDialogConfig?.title}
        setIsOpen={(isOpen: boolean) => {
          dispatch(
            isOpen && activeDialog ? openDialogInTradeBox(activeDialog) : closeDialogInTradeBox()
          );

          if (!isOpen) activeDialogConfig?.onClose?.();
        }}
        placement={DialogPlacement.Inline}
      >
        {activeDialogConfig?.content}
      </$Dialog>
    </$TradeBox>
  );
};
const $TradeBox = styled.section`
  --tradeBox-content-paddingTop: 1rem;
  --tradeBox-content-paddingRight: 1rem;
  --tradeBox-content-paddingBottom: 1rem;
  --tradeBox-content-paddingLeft: 1rem;

  ${layoutMixins.container}
  z-index: 0;

  ${layoutMixins.stack}
`;

const $Dialog = styled(Dialog)`
  --dialog-backgroundColor: var(--color-layer-2);

  --dialog-paddingX: 1.25rem;

  --dialog-header-paddingTop: 1.25rem;
  --dialog-header-paddingBottom: 0.25rem;

  --dialog-content-paddingTop: 1rem;
  --dialog-content-paddingRight: 1rem;
  --dialog-content-paddingBottom: 1rem;
  --dialog-content-paddingLeft: 1rem;
`;
