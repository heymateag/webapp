import React, { FC } from 'teact/teact';

import './TransactionRow.scss';

const TransactionRow: FC = () => {
  return (
    <div className="TransitionRow">
      <div className="left-box">
        <span className="title">English Online Class</span>
        <span className="sub-title">From Learn English</span>
      </div>
      <div className="right-box">
        <span className="price plus">
              +20$
        </span>
        <span className="date-time">
              2 days ago
        </span>
      </div>
    </div>
  );
};

export default TransactionRow;
