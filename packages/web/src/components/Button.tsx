import React from 'react';
import { BaseProps } from '../@types/common';
import { PiSpinnerGap } from 'react-icons/pi';

type Props = BaseProps & {
  disabled?: boolean;
  loading?: boolean;
  outlined?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
};

const Button: React.FC<Props> = (props) => {
  return (
    <button
      className={`${props.className ?? ''} ${
        props.outlined
          ? 'text-aws-font-color border-aws-font-color/20 border bg-white'
          : 'bg-aws-smile border text-white'
      }
      flex items-center justify-center rounded-lg p-1 px-3 ${
        props.disabled || props.loading ? 'opacity-30' : 'hover:brightness-75'
      }`}
      onClick={props.onClick}
      disabled={props.disabled || props.loading}
      type={props.type}
      >
      {props.loading && <PiSpinnerGap className="mr-2 animate-spin" />}
      {props.children}
    </button>
  );
};

export default Button;
