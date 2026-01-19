import React from 'react';
import classNames from 'classnames';
import { Icon } from 'semantic-ui-react';
import styles from './ThemeSwitch.module.scss';

const ThemeSwitch = ({ isDark, onToggle }) => {
  return (
    <div
      className={classNames(styles.switch, isDark && styles.switchDark)}
      onClick={onToggle}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className={styles.slider}>
        <Icon
          name={isDark ? 'moon' : 'sun'}
          className={styles.icon}
          size="small"
        />
      </div>
    </div>
  );
};

export default ThemeSwitch;
