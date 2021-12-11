import React, { FC, useCallback, useState, memo } from '../../lib/teact/teact';
import Transition from '../ui/Transition';
import { GlobalState, GlobalActions } from '../../global/types';
import Button from '../ui/Button';
import { withGlobal } from '../../lib/teact/teactn';
import defiService from '../../assets/heymate/defil-service.png';
import hmlogo from '../../assets/heymate/heymate-logo1x.png';
import social from '../../assets/heymate/social-commerce.png';
import { pick } from '../../util/iteratees';

type OwnProps = {
};
type DispatchProps = Pick<GlobalActions, (
  'returnToAuthPhoneNumber'
)>;

const AuthObBoarding: FC<OwnProps & DispatchProps> = ({returnToAuthPhoneNumber}) => {
  const [index, setIndex] = useState(0);
  const list = [
    {
      key: 1,
      title: 'Heymate Telegram',
      img: hmlogo,
      desc: 'Stay in touch with your customers on your existing social network on Telegram.',
    },
    {
      key: 2,
      title: 'Social Commerce',
      img: social,
      desc: `Create shops, marketplaces, promote your offers,
       plan your appointments and transact with your customers - all in one place easily!`,
    },
    {
      key: 3,
      title: 'DEFI services',
      img: defiService,
      desc: 'Get insured, borrow credit and so much more to come. Watch this space!',
    },
  ];
  const isFirst = index === 0;
  const isLast = index === list.length - 1;
  /**
   * Go To Next Slide
   */
  const selectNextMedia = useCallback(() => {
    if (isLast) {
      return;
    }
    setIndex(index + 1);
  }, [index, isLast]);

  /**
   * Go To Index
   */
  const goToIndex = (i: number) => {
    setIndex(i);
  };
  /**
   * Render Photos Tab
   */
  function renderPhotoTabs() {
    return (
      <div className="photo-dashes">
        {list.map((_, i) => (
          <span onClick={() => goToIndex(i)} className={`photo-dash ${i === index ? 'current' : ''}`} />
        ))}
      </div>
    );
  }
  /**
   * Render Main Sliders
   */
  const renderSLides = () => {
    const indexKey = list[index].key;
    const { title } = list[index];
    const image = list[index].img;
    return (
      <div key={indexKey}>
        <div className="img-holder">
          <img src={image} alt="" />
        </div>
        <h2>{title}</h2>
        <p className="note">
          Stay in touch with your customers on your existing
          <br />social network on Telegram.
        </p>
      </div>
    );
  };
  const [showOn, setShowOn] = useState('active');
  // useEffect(() => {
  //   const clssName = show ? 'active' : '';
  //   setShowOn(clssName);
  // }, [show]);
  const handlealaki = () => {
    setShowOn('');
    returnToAuthPhoneNumber();
  };
  return (
    <div id="auth-on-boarding-form" className={`on-boarding ${showOn}`}>
      <div id="container">
        <Transition
          activeKey={index}
          name="slide"
          className="profile-slide-container"
        >
          {renderSLides}
        </Transition>
        {renderPhotoTabs()}
        <div id="button-holder">
          <Button color="hm-primary" ripple onClick={handlealaki}>Keep Messaging</Button>
          <div id="hm-typo" />
        </div>
      </div>
    </div>
  );
};

export default memo(withGlobal(
  (global): OwnProps => {
    return {

    };
  },
  (setGlobal, actions): DispatchProps => pick(actions, [
    'returnToAuthPhoneNumber',
  ]),
)(AuthObBoarding));
