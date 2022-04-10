import React from 'react';
import { getTheme } from '@fluentui/react';
import PanelAction from '@components/core/Panel/PanelAction';
import './PanelHeader.css';

interface Props {
  label: string
  commands?: {[key: string]: {hidden?: boolean, icon: React.ReactNode, label: string}}
}

const PanelHeader: React.FC<Props> = ({label, commands}) => {
  const {
    palette: { neutralLight, neutralDark, neutralQuaternaryAlt }
  } = getTheme();

  return (
    <div
      className="PanelHeader"
      style={{
        backgroundColor: neutralLight,
        color: neutralDark,
        '--pg-panel-action-hover-bg': neutralQuaternaryAlt
      } as any}
    >
      <div className="PanelHeader__side--left">
        <span className="PanelHeader__title">
          {label}
        </span>
      </div>
      <ul className="PanelHeader__commands">
        {commands ? (
          Object.entries(commands)
            .map(([key, props]) => ({key, ...props}))
            .filter(({hidden}) => !hidden)
            .map((props) => (
              <li key={props.key}>
                <PanelAction {...props} />
              </li>
            ))
        ) : null}
      </ul>
    </div>
  );
};

export default PanelHeader;
