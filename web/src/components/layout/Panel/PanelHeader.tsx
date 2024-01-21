import React, {useContext} from 'react';
import {ITheme, ThemeContext} from '@fluentui/react';
import {PanelAction, PanelActionProps} from '~/components/layout/Panel/PanelAction';
import './PanelHeader.css';

interface Props {
  label: string
  commands?: {[key: string]: PanelActionProps},
}

export const PanelHeader: React.FC<Props> = ({label, commands}) => {
  const theme = useContext(ThemeContext);
  const {
    palette: { neutralLight, neutralDark, neutralQuaternaryAlt }
  } = theme as ITheme;

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
            .map(({key, ...props}) => (
              <li key={key}>
                <PanelAction {...props} />
              </li>
            ))
        ) : null}
      </ul>
    </div>
  );
};
