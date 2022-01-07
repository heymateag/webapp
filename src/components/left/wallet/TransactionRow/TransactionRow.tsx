import React, { FC } from 'teact/teact';

import './TransactionRow.scss';

interface Props {
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  address: string;
  tokenSymbol: string;
  weiEther: any;
}
const TransactionRow: FC = ({
  timeStamp,
  from,
  to,
  value,
  address,
  tokenSymbol,
  weiEther,

}) => {
  return (
    <div className="TransitionRow">
      <div className="left-box">
        <span className="title">Purchase Transaction</span>
        <span className="sub-title">Details not available</span>
      </div>
      <div className="right-box">
        {
          address === from
          && (
            <span className="price minus">
              { value / weiEther } {tokenSymbol}
            </span>
          )
        }
        {
          address !== from
          && (
            <span className="price plus">
              { value / weiEther } {tokenSymbol}
            </span>
          )
        }
        <span className="date-time">
          {new Date(timeStamp * 1000).toLocaleDateString('en')}

          { `  ${new Date(timeStamp * 1000).toLocaleTimeString('en')}`}
        </span>
      </div>
    </div>
  );
};

export default TransactionRow;
