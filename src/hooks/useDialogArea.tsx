import { useContext, createContext, useState, useRef, useEffect } from 'react';

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
  const dialogAreaRef = useRef(null);
  useEffect(() => {
    if (!dialogArea && dialogAreaRef?.current) {
      setDialogArea(dialogAreaRef?.current);
    }
  }, [dialogAreaRef]);
  return {
    dialogArea,
    setDialogArea,
    dialogAreaRef,
  };
};
