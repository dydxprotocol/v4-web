import { useContext, createContext, useState } from 'react';

const DialogAreaContext = createContext<ReturnType<typeof useDialogAreaContext> | undefined>(
  undefined
);

DialogAreaContext.displayName = 'DialogArea';

export const DialogAreaProvider = ({ ...props }) => (
  <DialogAreaContext.Provider value={useDialogAreaContext()} {...props} />
);

export const useDialogArea = () => useContext(DialogAreaContext);

const useDialogAreaContext = () => {
  const [dialogArea, setDialogArea] = useState<HTMLElement>();

  return {
    dialogArea,
    setDialogArea,
  };
};
