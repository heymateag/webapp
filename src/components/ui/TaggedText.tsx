import React, { FC } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import './TaggedText.scss';


type OwnProps = {
  children: any;
  color: 'green' | 'yellow' | 'blue' | 'gray' | 'red';
};
const TaggedText: FC<OwnProps> = ({
  children,
  color = 'green',
}) => {
  return (
    <span className={buildClassName('TaggedSpan', color)}>
      {children}
    </span>
  );
};

export default TaggedText;
