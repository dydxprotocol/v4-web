import { createContext, useContext, useRef } from 'react';

const DialogAreaContext = createContext<ReturnType<typeof useDialogAreaContext> | undefined>(
  undefined
);

DialogAreaContext.displayName = 'DialogArea';

export const DialogAreaProvider = ({ ...props }) => (
  <DialogAreaContext.Provider value={useDialogAreaContext()} {...props} />
);

export const useDialogArea = () => useContext(DialogAreaContext);

const useDialogAreaContext = () => {
  const dialogAreaRef = useRef(null);
  return {
    dialogAreaRef,
  };
};
