/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Icon } from 'semantic-ui-react';

import selectors from '../../../../selectors';
import { closePopup, usePopup } from '../../../../lib/popup';
import { push } from '../../../../lib/redux-router';
import { isListArchiveOrTrash } from '../../../../utils/record-helpers';
import { BoardMembershipRoles } from '../../../../constants/Enums';
import Paths from '../../../../constants/Paths';
import Linkify from '../../../common/Linkify';
import ActionsStep from '../../../task-lists/TaskList/Task/ActionsStep';

import styles from './Task.module.scss';

const Task = React.memo(({ id }) => {
  const selectTaskById = useMemo(() => selectors.makeSelectTaskById(), []);
  const selectTaskListById = useMemo(() => selectors.makeSelectTaskListById(), []);
  const selectLinkedCardById = useMemo(() => selectors.makeSelectCardById(), []);
  const selectCardById = useMemo(() => selectors.makeSelectCardById(), []);
  const selectListById = useMemo(() => selectors.makeSelectListById(), []);

  const task = useSelector((state) => selectTaskById(state, id));
  const taskList = useSelector((state) => selectTaskListById(state, task.taskListId));
  const card = useSelector((state) => taskList && selectCardById(state, taskList.cardId));
  const list = useSelector((state) => card && selectListById(state, card.listId));

  const linkedCard = useSelector(
    (state) => task.linkedCardId && selectLinkedCardById(state, task.linkedCardId),
  );

  const dispatch = useDispatch();

  const canEdit = useSelector((state) => {
    if (!list || isListArchiveOrTrash(list)) {
      return false;
    }

    const boardMembership = selectors.selectCurrentUserMembershipForCurrentBoard(state);
    return !!boardMembership && boardMembership.role === BoardMembershipRoles.EDITOR;
  });

  const isEditable = task.isPersisted && canEdit;

  const actionsPopupRef = useRef(null);

  const handleLinkClick = useCallback((event) => {
    event.stopPropagation();
  }, []);

  const handleNameEdit = useCallback(() => {
    if (!card) {
      return;
    }

    dispatch(push(Paths.CARDS.replace(':id', card.id)));
  }, [card, dispatch]);

  const handleContextMenu = useCallback(
    (event) => {
      const popup = actionsPopupRef.current;

      if (!isEditable || !popup || typeof popup.open !== 'function') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      closePopup();
      popup.open();
    },
    [isEditable],
  );

  const ActionsPopup = usePopup(ActionsStep);

  return (
    <li className={styles.wrapper} onContextMenu={handleContextMenu}>
      {task.linkedCardId ? (
        <>
          <Icon name="exchange" size="small" className={styles.icon} />
          <span className={classNames(styles.name, task.isCompleted && styles.nameCompleted)}>
            <Link to={Paths.CARDS.replace(':id', task.linkedCardId)} onClick={handleLinkClick}>
              {linkedCard ? linkedCard.name : task.name}
            </Link>
          </span>
        </>
      ) : (
        <span className={classNames(styles.name, task.isCompleted && styles.nameCompleted)}>
          <Linkify linkStopPropagation>{task.name}</Linkify>
        </span>
      )}
      {isEditable && (
        <ActionsPopup ref={actionsPopupRef} taskId={id} onNameEdit={handleNameEdit}>
          <span />
        </ActionsPopup>
      )}
    </li>
  );
});

Task.propTypes = {
  id: PropTypes.string.isRequired,
};

export default Task;
