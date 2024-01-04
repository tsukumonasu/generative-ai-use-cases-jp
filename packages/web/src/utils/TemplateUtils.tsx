import React from 'react';

// 改行コードを <br /> に変換する関数
export const renderWithLineBreaks = (text: string) => {
    return text.split('\n').map((line, index) => (
        <React.Fragment key={index}>
            {line}
            <br />
        </React.Fragment>
    ));
};

// 一定の文字数以上の場合は末尾に「...」を付ける関数
export const truncateText = (text: string, maxLength: number = 300) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};