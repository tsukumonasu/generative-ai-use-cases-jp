import React, { useCallback, useEffect, useState } from 'react';
import ButtonIcon from './ButtonIcon';
import { BaseProps } from '../@types/common';
import { PiCheck, PiClipboard } from 'react-icons/pi';
import copy from 'copy-to-clipboard';
import useInterUseCases from '../hooks/useInterUseCases';
import useTemplateMy from '../hooks/useTemplateMy';

type Props = BaseProps & {
  text: string;
  templateid: string;
  interUseCasesKey?: string;
};

const ButtonCopyWithTemplateCopycountup: React.FC<Props> = (props) => {
  const [showsCheck, setshowsCheck] = useState(false);
  const { setCopyTemporary } = useInterUseCases();

  const {
    incrementTemplateCopycount,
  } = useTemplateMy();

  useEffect(() => {
    if (props.interUseCasesKey) {
      setCopyTemporary(props.interUseCasesKey, props.text);
    }
  }, [props.interUseCasesKey, props.text, setCopyTemporary]);

  const copyMessage = useCallback((message: string, templateid: string) => {
    copy(message);
    setshowsCheck(true);

    incrementTemplateCopycount(templateid);

    setTimeout(() => {
      setshowsCheck(false);
    }, 3000);
  }, []);

  return (
    <ButtonIcon
      className={`${props.className ?? ''}`}
      onClick={() => {
        copyMessage(props.text, props.templateid);
      }}>
      {showsCheck ? <PiCheck /> : <PiClipboard />}
    </ButtonIcon>
  );
};

export default ButtonCopyWithTemplateCopycountup;
