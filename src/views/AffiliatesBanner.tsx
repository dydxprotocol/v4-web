import { styled } from 'twin.macro';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

export const AffiliatesBanner = () => {
  const dispatch = useAppDispatch();
  return (
    <$Background tw="row m-1 justify-between gap-0.5 rounded-0.5 bg-color-layer-1 pl-1 pr-2">
      <div tw="row">
        <img src="/affiliates-hedgie.png" alt="affiliates hedgie" tw="mt-1 h-8" />
        <div tw="column items-start gap-0.5">
          <div tw="row">
            <$Triangle />
            <div tw="inline-block rounded-0.5 bg-color-layer-6 px-1 py-0.5 font-bold text-color-text-2">
              Earn up to $1,500/mo for each new trader
            </div>
          </div>
          <div tw="ml-0.5">
            Refer a friend and they can receive up to $550 in discounts. <br />
            Want to view your earnings? Affiliates Program →
          </div>
        </div>
      </div>
      <div>
        <Button
          action={ButtonAction.Primary}
          slotLeft={<Icon iconName={IconName.Giftbox} />}
          size={ButtonSize.Medium}
          onClick={() => {
            dispatch(openDialog(DialogTypes.ShareAffiliate()));
          }}
        >
          Invite Friends
        </Button>
      </div>
    </$Background>
  );
};

const $Background = styled.div`
  background-image: url('/grid-background.svg');
  background-repeat: no-repeat;
  background-position-x: 100%;
  background-size: contain;
`;

const $Triangle = styled.div`
  width: 0;
  height: 0;

  border-top: 0.5rem solid transparent;
  border-bottom: 0.5rem solid transparent;
  border-right: 0.5rem solid var(--color-layer-6);
`;
