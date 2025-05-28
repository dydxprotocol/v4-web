import React from 'react';

import { useNavigate } from 'react-router-dom';

import { Tabs } from '@/components/Tabs';

type ElementProps = {
  sharedContent: React.ReactNode;
  items: {
    value: string;
    label: string;
  }[];
  value: string;
  disabled?: boolean;
};

type StyleProps = {
  className?: string;
};

export const TabNavigator = ({
  sharedContent,
  className,
  items,
  value,
  disabled,
}: ElementProps & StyleProps) => {
  const navigate = useNavigate();

  return (
    <Tabs
      className={className}
      fullWidthTabs
      dividerStyle="underline"
      value={value}
      items={items}
      onValueChange={(itemPath: string) => {
        navigate(itemPath);
      }}
      disabled={disabled}
      sharedContent={sharedContent}
    />
  );
};
