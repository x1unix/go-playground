import React from 'react';
import './PanelAction.css';

export interface PanelActionProps {
  hidden?: boolean
  icon: React.ReactNode
  label: string
  onClick?: () => void
}

const PanelAction: React.FC<PanelActionProps> = ({hidden, icon, label, onClick}) => {
  if (hidden) {
    return null;
  }

  return (
    <button
      className="PanelAction"
      title={label}
      onClick={onClick}
    >
      {icon}
    </button>
  );
};

export default PanelAction;
