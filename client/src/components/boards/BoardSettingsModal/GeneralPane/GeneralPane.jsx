/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Divider, Header, Tab } from 'semantic-ui-react';

import selectors from '../../../../selectors';
import entryActions from '../../../../entry-actions';
import { usePopupInClosableContext } from '../../../../hooks';
import EditInformation from './EditInformation';
import ConfirmationStep from '../../../common/ConfirmationStep';

import styles from './GeneralPane.module.scss';

const GeneralPane = React.memo(() => {
  const selectBoardById = useMemo(() => selectors.makeSelectBoardById(), []);

  const boardId = useSelector((state) => selectors.selectCurrentModal(state).params.id);
  const board = useSelector((state) => selectBoardById(state, boardId));

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const handleArchiveConfirm = useCallback(() => {
    dispatch(
      entryActions.updateBoard(boardId, {
        isArchived: true,
      }),
    );
  }, [boardId, dispatch]);

  const handleRestoreConfirm = useCallback(() => {
    dispatch(
      entryActions.updateBoard(boardId, {
        isArchived: false,
      }),
    );
  }, [boardId, dispatch]);

  const handleDeleteConfirm = useCallback(() => {
    dispatch(entryActions.deleteBoard(boardId));
  }, [boardId, dispatch]);

  const ConfirmationPopup = usePopupInClosableContext(ConfirmationStep);

  if (!board) {
    return null;
  }

  return (
    <Tab.Pane attached={false} className={styles.wrapper}>
      <EditInformation />
      <Divider horizontal section>
        <Header as="h4">
          {t('common.dangerZone', {
            context: 'title',
          })}
        </Header>
      </Divider>
      <div className={styles.action}>
        {board.isArchived ? (
          <ConfirmationPopup
            title="common.restoreBoard"
            content="common.areYouSureYouWantToRestoreThisBoard"
            buttonContent="action.restoreBoard"
            typeValue={board.name}
            typeContent="common.typeTitleToConfirm"
            onConfirm={handleRestoreConfirm}
          >
            <Button className={styles.actionButton}>
              {t(`action.restoreBoard`, {
                context: 'title',
              })}
            </Button>
          </ConfirmationPopup>
        ) : (
          <ConfirmationPopup
            title="common.archiveBoard"
            content="common.areYouSureYouWantToArchiveThisBoard"
            buttonContent="action.archiveBoard"
            typeValue={board.name}
            typeContent="common.typeTitleToConfirm"
            onConfirm={handleArchiveConfirm}
          >
            <Button className={styles.actionButton}>
              {t(`action.archiveBoard`, {
                context: 'title',
              })}
            </Button>
          </ConfirmationPopup>
        )}
      </div>
      <div className={styles.action}>
        <ConfirmationPopup
          title="common.deleteBoard"
          content="common.areYouSureYouWantToDeleteThisBoard"
          buttonContent="action.deleteBoard"
          typeValue={board.name}
          typeContent="common.typeTitleToConfirm"
          onConfirm={handleDeleteConfirm}
        >
          <Button className={styles.actionButton}>
            {t(`action.deleteBoard`, {
              context: 'title',
            })}
          </Button>
        </ConfirmationPopup>
      </div>
    </Tab.Pane>
  );
});

export default GeneralPane;
