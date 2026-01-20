/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import entryActions from '../../entry-actions';
import Paths from '../../constants/Paths';

import styles from './CalendarEvent.module.scss';

const CalendarEvent = React.memo(({ card, isCompact }) => {
  const dispatch = useDispatch();

  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      dispatch(entryActions.openCardModal(card.id));
    },
    [card.id, dispatch],
  );

  const dueDate = new Date(card.dueDate);
  const timeString = dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Get the first label color if available
  const labelColor = card.labels && card.labels.length > 0 ? card.labels[0].color : null;

  return (
    <Link
      to={Paths.CARDS.replace(':id', card.id)}
      className={classNames(styles.event, isCompact && styles.compact)}
      onClick={handleClick}
      style={labelColor ? { borderLeftColor: labelColor } : undefined}
    >
      <div className={styles.content}>
        <span className={styles.name}>{card.name}</span>
        {!isCompact && <span className={styles.time}>{timeString}</span>}
      </div>
      {!isCompact && card.boardName && <span className={styles.board}>{card.boardName}</span>}
    </Link>
  );
});

CalendarEvent.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    boardName: PropTypes.string,
    labels: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        color: PropTypes.string,
      }),
    ),
  }).isRequired,
  isCompact: PropTypes.bool,
};

CalendarEvent.defaultProps = {
  isCompact: false,
};

export default CalendarEvent;
