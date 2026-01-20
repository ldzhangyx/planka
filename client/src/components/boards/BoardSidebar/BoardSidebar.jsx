/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import ModalTypes from '../../../constants/ModalTypes';
import { BoardContexts } from '../../../constants/Enums';
import { BoardContextIcons } from '../../../constants/Icons';
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

  const handleLinkClick = useCallback(() => {
    if (isActive && board && board.context !== BoardContexts.BOARD) {
      dispatch(entryActions.updateContextInCurrentBoard(BoardContexts.BOARD));
    }
  }, [board, dispatch, isActive]);

  const handleEditClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch(entryActions.openBoardSettingsModal(id));
    },
    [id, dispatch],
  );

  if (!board) return null;

  const isBoardActive = isActive && board.context === BoardContexts.BOARD;

  return (
    <div className={classNames(styles.item, isBoardActive && styles.itemActive)}>
      <Link
        to={Paths.BOARDS.replace(':id', id)}
        title={board.name}
        className={styles.link}
        onClick={handleLinkClick}
      >
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
  const archivedBoardIds = useSelector(selectors.selectArchivedBoardIdsForCurrentProject);
  const { projectId, isCalendar } = useSelector(selectors.selectPath);
  const board = useSelector(selectors.selectCurrentBoard);
  const modal = useSelector(selectors.selectCurrentModal);

  const minWidth = 200;
  const maxWidth = 360;
  const storageKey = 'planka.boardSidebar.width';

  const [width, setWidth] = useState(() => {
    const saved = Number.parseInt(localStorage.getItem(storageKey), 10);
    if (Number.isFinite(saved)) {
      return Math.min(maxWidth, Math.max(minWidth, saved));
    }

    return 240;
  });

  const widthRef = useRef(width);
  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleResizeMouseDown = useCallback(
    (event) => {
      event.preventDefault();
      isResizingRef.current = true;
      startXRef.current = event.clientX;
      startWidthRef.current = widthRef.current;

      const handleMouseMove = (moveEvent) => {
        if (!isResizingRef.current) {
          return;
        }

        const deltaX = moveEvent.clientX - startXRef.current;
        const nextWidth = Math.min(
          maxWidth,
          Math.max(minWidth, startWidthRef.current + deltaX),
        );

        setWidth(nextWidth);
      };

      const handleMouseUp = () => {
        if (!isResizingRef.current) {
          return;
        }

        isResizingRef.current = false;
        localStorage.setItem(storageKey, String(widthRef.current));
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [maxWidth, minWidth, storageKey],
  );

  const canAdd = useSelector((state) => {
    const isEditModeEnabled = selectors.selectIsEditModeEnabled(state);

    if (!isEditModeEnabled) {
      return isEditModeEnabled;
    }

    return selectors.selectIsCurrentUserManagerForCurrentProject(state);
  });

  const AddBoardPopup = usePopup(AddBoardStep);
  const hasExtraTabs = !!projectId || !!board;

  const dispatch = useDispatch();

  const isActivitiesActive = modal && modal.type === ModalTypes.BOARD_ACTIVITIES;

  const handleSelectContextClick = useCallback(
    (context) => {
      if (!board) {
        return;
      }

      dispatch(entryActions.updateContextInCurrentBoard(context));
    },
    [board, dispatch],
  );

  const handleActivitiesClick = useCallback(() => {
    if (!board) {
      return;
    }

    dispatch(entryActions.openBoardActivitiesModal());
  }, [board, dispatch]);

  return (
    <div className={styles.sidebar} style={{ width, minWidth: width }}>
      <div className={styles.resizer} onMouseDown={handleResizeMouseDown} role="presentation" />
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
        {archivedBoardIds.length > 0 && (
          <div className={styles.sectionHeader}>{t('common.archivedBoards')}</div>
        )}
        {archivedBoardIds.map((boardId) => (
          <SidebarItem key={boardId} id={boardId} />
        ))}
        {board && (
          <button
            type="button"
            className={classNames(
              styles.item,
              styles.actionButton,
              board.context === BoardContexts.TRASH && styles.itemActive,
            )}
            onClick={() => handleSelectContextClick(BoardContexts.TRASH)}
          >
            <div className={styles.iconWrapper}>
              <Icon name={BoardContextIcons[BoardContexts.TRASH]} className={styles.icon} />
            </div>
            <span className={styles.name}>{t(`common.${BoardContexts.TRASH}`)}</span>
          </button>
        )}
        {hasExtraTabs && <div className={styles.divider} />}
        {projectId && (
          <Link
            to={Paths.PROJECT_CALENDAR.replace(':id', projectId)}
            className={classNames(
              styles.item,
              styles.actionLink,
              isCalendar && styles.itemActive,
            )}
          >
            <div className={styles.iconWrapper}>
              <Icon name="calendar alternate outline" className={styles.icon} />
            </div>
            <span className={styles.name}>{t('common.calendar')}</span>
          </Link>
        )}
        {board && (
          <button
            type="button"
            className={classNames(
              styles.item,
              styles.actionButton,
              isActivitiesActive && styles.itemActive,
            )}
            onClick={handleActivitiesClick}
          >
            <div className={styles.iconWrapper}>
              <Icon name="list ul" className={styles.icon} />
            </div>
            <span className={styles.name}>{t('common.actions')}</span>
          </button>
        )}
      </div>
    </div>
  );
});

export default BoardSidebar;
