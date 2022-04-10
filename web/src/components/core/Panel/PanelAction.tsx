import React from 'react';
import './PanelAction.css';
import {getTheme} from "@fluentui/react";

export interface PanelActionProps {
  hidden?: boolean
  icon: React.ReactNode
  label: string
  onClick?: () => void
}

const PanelAction: React.FC<PanelActionProps> = ({hidden, icon, label, onClick}) => {
  const {
    palette: { neutralQuaternaryAlt }
  } = getTheme();
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
