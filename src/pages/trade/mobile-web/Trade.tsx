import { OrderSide } from '@/bonsai/forms/trade/types';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonAction, ButtonShape, ButtonSize, ButtonState } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useCurrentMarketId } from '@/hooks/useCurrentMarketId';
import { usePageTitlePriceUpdates } from '@/hooks/usePageTitlePriceUpdates';
import { usePerpetualsComplianceState } from '@/hooks/usePerpetualsComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { DetachedSection } from '@/components/ContentSection';
import { MarketsMenuDialog } from '@/views/dialogs/MarketsDialog/MarketsDialog';
import { UserMenuDialog } from '@/views/dialogs/MobileUserMenuDialog';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';

import { HorizontalPanel } from '../HorizontalPanel';
import LaunchableMarket from '../LaunchableMarket';
import { MobileTopPanel } from '../MobileTopPanel';
import { TradeHeaderMobile } from './TradeHeader';

const TradePage = () => {
  const dispatch = useAppDispatch();
  const { isViewingUnlaunchedMarket } = useCurrentMarketId();
  const { complianceState } = usePerpetualsComplianceState();
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);
  const stringGetter = useStringGetter();
  const navigate = useNavigate();

  usePageTitlePriceUpdates();

  if (isViewingUnlaunchedMarket) {
    return <LaunchableMarket />;
  }

  const isDisabled = complianceState !== ComplianceStates.FULL_ACCESS;

  const footerContent = isDisabled ? (
    <Button
      tw="flex-1 border border-solid border-color-layer-6"
      shape={ButtonShape.Pill}
      size={ButtonSize.Large}
      state={ButtonState.Disabled}
      action={ButtonAction.SimpleSecondary}
    >
      {stringGetter({ key: STRING_KEYS.UNAVAILABLE })}
    </Button>
  ) : canAccountTrade ? (
    <>
      <Button
        tw="flex-1 bg-color-negative text-color-layer-0"
        shape={ButtonShape.Pill}
        size={ButtonSize.Large}
        onClick={() => {
          navigate(`${AppRoute.TradeForm}`);
          dispatch(tradeFormActions.setSide(OrderSide.SELL));
        }}
      >
        {stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })}
      </Button>

      <Button
        tw="flex-1 bg-color-positive text-color-layer-0"
        shape={ButtonShape.Pill}
        size={ButtonSize.Large}
        onClick={() => {
          navigate(`${AppRoute.TradeForm}`);
          dispatch(tradeFormActions.setSide(OrderSide.BUY));
        }}
      >
        {stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })}
      </Button>
    </>
  ) : (
    <OnboardingTriggerButton tw="flex-1" shape={ButtonShape.Pill} size={ButtonSize.Base} />
  );

  return (
    <div tw="flexColumn items-center gap-[0.75em]">
      <TradeHeaderMobile />

      <$MobileContent>
        <DetachedSection>
          <MobileTopPanel />
        </DetachedSection>

        <DetachedSection>
          <HorizontalPanel />
        </DetachedSection>

        {/* <DetachedSection>
          <MobileBottomPanel />
        </DetachedSection> */}
      </$MobileContent>

      <div
        tw="row fixed bottom-3 left-0 right-0 gap-1.25 px-1.25 py-1.25"
        css={{
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0), var(--color-layer-1))',
        }}
      >
        {footerContent}
      </div>

      <UserMenuDialog />
      <MarketsMenuDialog />
    </div>
  );
};

export default TradePage;

const $MobileContent = styled.article`
  ${layoutMixins.contentContainerPage}
`;
