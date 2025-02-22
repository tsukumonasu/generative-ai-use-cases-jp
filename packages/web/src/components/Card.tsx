import React from 'react';
import { BaseProps } from '../@types/common';
import RowItem from './RowItem';
import Help from './Help';

type Props = BaseProps & {
  label?: string;
  help?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

const Card: React.FC<Props> = (props) => {
  return (
    <div
      className={`${props.className ?? ''} border-aws-font-color/20 rounded-lg border p-5 shadow`}
      onClick={props.onClick} // この行を追加
    >
      {props.label && (
        <RowItem className="flex items-center">
          <span className="font-semibold">{props.label}</span>
          {props.help && <Help className="ml-1" message={props.help} />}
        </RowItem>
      )}
      {props.children}
    </div>
  );
};

export default Card;
