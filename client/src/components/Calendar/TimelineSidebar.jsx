/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from 'semantic-ui-react';
import { Droppable, Draggable } from 'react-beautiful-dnd';

import { push } from '../../lib/redux-router';
import Paths from '../../constants/Paths';
import selectors from '../../selectors';

import styles from './TimelineSidebar.module.scss';

const TimelineSidebar = React.memo(({ cards, unscheduledCards }) => {
  const [t] = useTranslation();
  const dispatch = useDispatch();
  const { projectId } = useSelector(selectors.selectPath);

  const minWidth = 220;
  const maxWidth = 420;
  const storageKey = 'planka.calendarSidebar.width';

  const [width, setWidth] = useState(() => {
    const saved = Number.parseInt(localStorage.getItem(storageKey), 10);
    if (Number.isFinite(saved)) {
      return Math.min(maxWidth, Math.max(minWidth, saved));
    }

    return 280;
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
          Math.max(minWidth, startWidthRef.current - deltaX),
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



  const groupedCards = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const groups = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
    };

    cards.forEach((card) => {
      const dueDate = new Date(card.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        groups.overdue.push(card);
      } else if (dueDate.getTime() === today.getTime()) {
        groups.today.push(card);
      } else if (dueDate.getTime() === tomorrow.getTime()) {
        groups.tomorrow.push(card);
      } else if (dueDate < nextWeek) {
        groups.thisWeek.push(card);
      } else {
        groups.later.push(card);
      }
    });

    return groups;
  }, [cards]);

  const handleCardClick = useCallback(
    (cardId) => {
      if (!projectId) {
        return;
      }

      dispatch(
        push(
          Paths.PROJECT_CALENDAR_CARD.replace(':projectId', projectId).replace(
            ':cardId',
            cardId,
          ),
        ),
      );
    },
    [dispatch, projectId],
  );

  const renderGroup = (title, items, icon, droppablePrefix) => {
    if (items.length === 0) return null;

    return (
      <div className={styles.group}>
        <div className={styles.groupHeader}>
          <Icon name={icon} className={styles.groupIcon} />
          <span className={styles.groupTitle}>{title}</span>
          <span className={styles.groupCount}>{items.length}</span>
        </div>
        <Droppable droppableId={`${droppablePrefix}-agenda`} isDropDisabled type="CARD">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={styles.groupItems}
            >
              {items.map((card, index) => (
                <Draggable key={card.id} draggableId={`agenda-${card.id}`} index={index}>
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      key={card.id}
                      className={`${styles.agendaItem} ${snapshot.isDragging ? styles.dragging : ''}`}
                    >
                      <div {...dragProvided.dragHandleProps} className={styles.dragHandle}>
                        <Icon name="bars" size="small" />
                      </div>
                      <button
                        type="button"
                        className={styles.agendaItemContent}
                        onClick={() => handleCardClick(card.id)}
                      >
                        <span className={styles.agendaItemName}>{card.name}</span>
                        {card.boardName && (
                          <span className={styles.agendaItemBoard}>{card.boardName}</span>
                        )}
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  const hasAnyCards = cards.length > 0;
  const hasUnscheduledCards = unscheduledCards && unscheduledCards.length > 0;

  return (
    <div className={styles.sidebar} style={{ width, minWidth: width }}>
      <div className={styles.resizer} onMouseDown={handleResizeMouseDown} role="presentation" />
      {/* Agenda Section - Top */}
      <div className={styles.section}>
        <div className={styles.header}>
          <Icon name="list" className={styles.headerIcon} />
          <h3 className={styles.headerTitle}>{t('common.agenda', { defaultValue: 'Agenda' })}</h3>
        </div>

        <div className={styles.content}>
          {hasAnyCards ? (
            <>
              {renderGroup(t('common.overdue', { defaultValue: 'Overdue' }), groupedCards.overdue, 'warning sign', 'overdue')}
              {renderGroup(t('common.today', { defaultValue: 'Today' }), groupedCards.today, 'calendar check', 'today')}
              {renderGroup(t('common.tomorrow', { defaultValue: 'Tomorrow' }), groupedCards.tomorrow, 'calendar outline', 'tomorrow')}
              {renderGroup(t('common.thisWeek', { defaultValue: 'This Week' }), groupedCards.thisWeek, 'calendar alternate', 'thisweek')}
              {renderGroup(t('common.later', { defaultValue: 'Later' }), groupedCards.later, 'calendar plus', 'later')}
            </>
          ) : (
            <div className={styles.empty}>
              <Icon name="calendar outline" size="big" />
              <p>{t('common.noUpcomingTasks', { defaultValue: 'No upcoming tasks' })}</p>
            </div>
          )}
        </div>
      </div>

      {/* Unscheduled Section - Bottom */}
      <div className={styles.section}>
        <div className={styles.header}>
          <Icon name="inbox" className={styles.headerIcon} />
          <h3 className={styles.headerTitle}>{t('common.unscheduled', { defaultValue: 'Unscheduled' })}</h3>
          {hasUnscheduledCards && (
            <span className={styles.headerCount}>{unscheduledCards.length}</span>
          )}
        </div>

        <Droppable droppableId="unscheduled-tasks" type="CARD">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`${styles.unscheduledContent} ${snapshot.isDraggingOver ? styles.dragOver : ''}`}
            >
              {hasUnscheduledCards ? (
                unscheduledCards.map((card, index) => (
                  <Draggable key={card.id} draggableId={`unscheduled-${card.id}`} index={index}>
                    {(dragProvided, snapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={`${styles.unscheduledItem} ${snapshot.isDragging ? styles.dragging : ''}`}
                      >
                        <div {...dragProvided.dragHandleProps} className={styles.dragHandle}>
                          <Icon name="bars" className={styles.grabIcon} />
                        </div>
                        <button
                          type="button"
                          className={styles.unscheduledItemContent}
                          onClick={() => handleCardClick(card.id)}
                        >
                          <span className={styles.unscheduledItemName}>{card.name}</span>
                          {card.boardName && (
                            <span className={styles.unscheduledItemBoard}>{card.boardName}</span>
                          )}
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <div className={styles.empty}>
                  <Icon name="check circle outline" size="big" />
                  <p>{t('common.allTasksScheduled', { defaultValue: 'All tasks scheduled' })}</p>
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
});

TimelineSidebar.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    }),
  ).isRequired,
  unscheduledCards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
};

TimelineSidebar.defaultProps = {
  unscheduledCards: [],
};

export default TimelineSidebar;
