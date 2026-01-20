/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useRef } from 'react';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { useTranslation, Trans } from 'react-i18next';
import { Button, Icon, Loader } from 'semantic-ui-react';
import { useTransitioning } from '../../../lib/hooks';
import { usePopup } from '../../../lib/popup';

import selectors from '../../../selectors';
import Home from '../Home';
import GhostError from '../GhostError';
import Board from '../../boards/Board';
import AddBoardStep from '../../boards/AddBoardStep';
import BoardSidebar from '../../boards/BoardSidebar';
import BoardActions from '../../boards/BoardActions';
import Calendar from '../../Calendar';
import CardModal from '../../cards/CardModal';

import styles from './Static.module.scss';

const Static = React.memo(() => {
  const { cardId, projectId, isCalendar } = useSelector(selectors.selectPath);
  const board = useSelector(selectors.selectCurrentBoard);
  const isFetching = useSelector(selectors.selectIsContentFetching);
  const isFavoritesActive = useSelector(selectors.selectIsFavoritesActiveForCurrentUser);

  const canAddBoard = useSelector((state) =>
    selectors.selectIsCurrentUserManagerForCurrentProject(state),
  );

  const [t] = useTranslation();

  const wrapperRef = useRef(null);

  const handleTransitionEnd = useTransitioning(wrapperRef, styles.wrapperTransitioning, [
    isFavoritesActive,
  ]);

  const AddBoardPopup = usePopup(AddBoardStep);

  let wrapperClassNames;
  let contentNode;

  if (isFetching) {
    wrapperClassNames = [styles.wrapperLoader];
    contentNode = <Loader active size="huge" />;
  } else if (projectId === undefined) {
    wrapperClassNames = [isFavoritesActive && styles.wrapperWithFavorites, styles.wrapperVertical];
    contentNode = <Home />;
  } else if (cardId === null) {
    wrapperClassNames = [isFavoritesActive && styles.wrapperWithFavorites, styles.wrapperFlex];
    contentNode = <GhostError message="common.cardNotFound" />;
  } else if (board === null) {
    wrapperClassNames = [isFavoritesActive && styles.wrapperWithFavorites, styles.wrapperFlex];
    contentNode = <GhostError message="common.boardNotFound" />;
  } else if (projectId === null) {
    wrapperClassNames = [isFavoritesActive && styles.wrapperWithFavorites, styles.wrapperFlex];
    contentNode = <GhostError message="common.projectNotFound" />;
  } else if (isCalendar) {
    // Handle Calendar View
    wrapperClassNames = [
      isFavoritesActive ? styles.wrapperBoardWithFavorites : styles.wrapperBoard,
      styles.wrapperFlex,
    ];

    contentNode = (
      <>
        <BoardSidebar />
        <div style={{ flexGrow: 1, overflow: 'hidden' }}>
          <Calendar />
        </div>
        {cardId && <CardModal />}
      </>
    );
  } else if (board === undefined) {
    wrapperClassNames = [
      isFavoritesActive ? styles.wrapperProjectWithFavorites : styles.wrapperProject,
      styles.wrapperFlex,
    ];

    contentNode = (
      <>
        <BoardSidebar />
        <div className={styles.message}>
          <Icon inverted name="hand point up outline" size="huge" className={styles.messageIcon} />
          <h1 className={styles.messageTitle}>
            {t('common.openBoard', {
              context: 'title',
            })}
          </h1>
          <div className={styles.messageContent}>
            <Trans i18nKey="common.createNewOneOrSelectExistingOne" />
          </div>
          {canAddBoard && (
            <AddBoardPopup>
              <Button basic positive size="large" className={styles.button}>
                <Icon name="plus" />
                {t('action.createBoard')}
              </Button>
            </AddBoardPopup>
          )}
        </div>
      </>
    );
  } else if (board.isFetching) {
    wrapperClassNames = [
      styles.wrapperLoader,
      isFavoritesActive ? styles.wrapperProjectWithFavorites : styles.wrapperProject,
    ];

    contentNode = (
      <>
        <BoardSidebar />
        <Loader active size="big" />
      </>
    );
  } else {
    wrapperClassNames = [
      isFavoritesActive ? styles.wrapperBoardWithFavorites : styles.wrapperBoard,
      styles.wrapperFlex,
    ];

    contentNode = (
      <>
        <BoardSidebar />
        <div
          style={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {board && !board.isFetching && <BoardActions />}
          <div style={{ flexGrow: 1, minWidth: 0, position: 'relative' }}>
            <Board />
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={classNames(styles.wrapper, ...wrapperClassNames)}
      onTransitionEnd={handleTransitionEnd}
    >
      {contentNode}
    </div>
  );
});

export default Static;
