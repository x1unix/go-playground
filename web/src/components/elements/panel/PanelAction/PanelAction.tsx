import React from 'react';
import clsx from 'clsx';
import './PanelAction.css';

export interface PanelActionProps {
  hidden?: boolean
  icon: React.ReactNode
  label: string
  desktopOnly?: boolean
  onClick?: () => void
}

export const PanelAction: React.FC<PanelActionProps> = ({hidden, icon, desktopOnly, label, onClick}) => {
  if (hidden) {
    return null;
  }

  return (
    <button
      className={clsx('PanelAction', desktopOnly && 'PanelAction--desktopOnly')}
      title={label}
      onClick={onClick}
    >
      {icon}
    </button>
  );
};
