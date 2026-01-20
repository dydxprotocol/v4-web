import type { FC } from 'react';
import { Dialog } from 'radix-ui';
import { useBoolean } from 'usehooks-ts';
import type { Promiseable } from '@/types/Promiseable';
import * as $ from './Actions.css';

export interface ActionsProps {
  submittable: boolean;
  onSubmit: () => Promiseable<void>;
  submitTitle: string;
}

export const Actions: FC<ActionsProps> = (props) => {
  const isLocked = useBoolean(false);

  const handleClick = async () => {
    isLocked.setTrue();
    try {
      await props.onSubmit();
    } finally {
      isLocked.setFalse();
    }
  };

  const isInteractive = isLocked.value === false && props.submittable;

  return (
    <div className={$.buttonGroup}>
      <Dialog.Close type="button" className={$.cancelButton}>
        Cancel
      </Dialog.Close>

      <button
        type="button"
        className={$.decreaseButton}
        disabled={!isInteractive}
        onClick={handleClick}
      >
        {props.submitTitle}
      </button>
    </div>
  );
};
