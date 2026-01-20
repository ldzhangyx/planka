/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from 'semantic-ui-react';
import { usePopup } from '../../../lib/popup';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import Paths from '../../../constants/Paths';
import AddBoardStep from '../AddBoardStep';

import styles from './BoardSidebar.module.scss';

const SidebarItem = React.memo(({ id }) => {
  const selectBoardById = useMemo(() => selectors.makeSelectBoardById(), []);
  const selectNotificationsTotalByBoardId = useMemo(
    () => selectors.makeSelectNotificationsTotalByBoardId(),
    [],
  );

  const board = useSelector((state) => selectBoardById(state, id));
  const notificationsTotal = useSelector((state) => selectNotificationsTotalByBoardId(state, id));
  const isActive = useSelector((state) => id === selectors.selectPath(state).boardId);

  const canEdit = useSelector((state) => {
    const isEditModeEnabled = selectors.selectIsEditModeEnabled(state);

    if (!isEditModeEnabled) {
      return isEditModeEnabled;
    }

    return selectors.selectIsCurrentUserManagerForCurrentProject(state);
  });

  const dispatch = useDispatch();

  const handleEditClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch(entryActions.openBoardSettingsModal(id));
    },
    [id, dispatch],
  );

  if (!board) return null;

  return (
    <div className={classNames(styles.item, isActive && styles.itemActive)}>
      <Link to={Paths.BOARDS.replace(':id', id)} title={board.name} className={styles.link}>
        <div className={styles.iconWrapper}>
          <Icon name="columns" className={styles.icon} />
        </div>
        <span className={styles.name}>{board.name}</span>
        {notificationsTotal > 0 && (
          <span className={styles.notifications}>{notificationsTotal}</span>
        )}
      </Link>
      {canEdit && (
        <Button className={styles.editButton} onClick={handleEditClick}>
          <Icon fitted name="pencil" size="small" />
        </Button>
      )}
    </div>
  );
});

SidebarItem.propTypes = {
  id: PropTypes.string.isRequired,
};

const BoardSidebar = React.memo(() => {
  const [t] = useTranslation();
  const boardIds = useSelector(selectors.selectBoardIdsForCurrentProject);
  const { projectId } = useSelector(selectors.selectPath);

  const canAdd = useSelector((state) => {
    const isEditModeEnabled = selectors.selectIsEditModeEnabled(state);

    if (!isEditModeEnabled) {
      return isEditModeEnabled;
    }

    return selectors.selectIsCurrentUserManagerForCurrentProject(state);
  });

  const AddBoardPopup = usePopup(AddBoardStep);

  return (
    <div className={styles.sidebar}>
      <div className={styles.list}>
        {boardIds.map((boardId) => (
          <SidebarItem key={boardId} id={boardId} />
        ))}
        {canAdd && (
          <AddBoardPopup>
            <button type="button" className={styles.addButton}>
              <Icon name="plus" />
              <span className={styles.addButtonText}>{t('action.createBoard')}</span>
            </button>
          </AddBoardPopup>
        )}
        <Link
          to={Paths.PROJECT_CALENDAR.replace(':id', projectId)}
          className={classNames(styles.item, styles.link)} // Use similar styles
        >
          <div className={styles.iconWrapper}>
            <Icon name="calendar alternate outline" className={styles.icon} />
          </div>
          <span className={styles.name}>{t('common.calendar')}</span>
        </Link>
      </div>
    </div>
  );
});

export default BoardSidebar;
