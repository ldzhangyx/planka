/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import { useSelector } from 'react-redux';

import selectors from '../../../selectors';
import Header from '../Header';
import Favorites from '../Favorites';
import HomeActions from '../HomeActions';
import Project from '../../projects/Project';
import styles from './Fixed.module.scss';

const Fixed = React.memo(() => {
  const { projectId } = useSelector(selectors.selectPath);

  return (
    <div className={styles.wrapper}>
      <Header />
      <Favorites />
      {projectId === undefined && <HomeActions />}
      {projectId && <Project />}
    </div>
  );
});

export default Fixed;
