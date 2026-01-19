/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback } from 'react';
import classNames from 'classnames';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button, Icon, Menu } from 'semantic-ui-react';
import { usePopup } from '../../../lib/popup';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import Paths from '../../../constants/Paths';
import { BoardMembershipRoles, BoardViews, UserRoles } from '../../../constants/Enums';
import UserAvatar from '../../users/UserAvatar';
import UserActionsStep from '../../users/UserActionsStep';
import NotificationsStep from '../../notifications/NotificationsStep';
import Favorites from '../Favorites'; // Re-use Favorites here

import styles from './Sidebar.module.scss';

const POPUP_PROPS = {
  position: 'bottom right', // Adjust popup position for sidebar? 'right center'?
};

const Sidebar = React.memo(() => {
  const user = useSelector(selectors.selectCurrentUser);
  const project = useSelector(selectors.selectCurrentProject);
  const board = useSelector(selectors.selectCurrentBoard);
  const notificationIds = useSelector(selectors.selectNotificationIdsForCurrentUser) || [];
  const isFavoritesEnabled = useSelector(selectors.selectIsFavoritesEnabled);
  const isEditModeEnabled = useSelector(selectors.selectIsEditModeEnabled);

  const withFavoritesToggler = useSelector(
    (state) => (selectors.selectFavoriteProjectIdsForCurrentUser(state) || []).length > 0,
  );

  const { withEditModeToggler, canEditProject } = useSelector((state) => {
    if (!project || !user) {
      return {
        withEditModeToggler: false,
        canEditProject: false,
      };
    }

    const isAdminInSharedProject = user.role === UserRoles.ADMIN && !project.ownerProjectManagerId;
    const isManager = selectors.selectIsCurrentUserManagerForCurrentProject(state);

    if (isAdminInSharedProject || isManager) {
      return {
        withEditModeToggler: true,
        canEditProject: isEditModeEnabled,
      };
    }

    if (!board) {
      return {
        withEditModeToggler: false,
        canEditProject: false,
      };
    }

    const boardMembership = selectors.selectCurrentUserMembershipForCurrentBoard(state);
    const isEditor = !!boardMembership && boardMembership.role === BoardMembershipRoles.EDITOR;

    return {
      withEditModeToggler: board.view === BoardViews.KANBAN && isEditor,
      canEditProject: false,
    };
  }, shallowEqual);

  const dispatch = useDispatch();

  const handleToggleFavoritesClick = useCallback(() => {
    dispatch(entryActions.toggleFavorites(!isFavoritesEnabled));
  }, [isFavoritesEnabled, dispatch]);

  const handleToggleEditModeClick = useCallback(() => {
    dispatch(entryActions.toggleEditMode(!isEditModeEnabled));
  }, [isEditModeEnabled, dispatch]);

  const handleProjectSettingsClick = useCallback(() => {
    if (!canEditProject) {
      return;
    }

    dispatch(entryActions.openProjectSettingsModal());
  }, [canEditProject, dispatch]);

  const NotificationsPopup = usePopup(NotificationsStep, { position: 'right center' });
  const UserActionsPopup = usePopup(UserActionsStep, { position: 'right center' });

  // Don't render sidebar if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <Link to={Paths.ROOT} className={styles.logo}>
        PLANKA
      </Link>

      <Menu inverted vertical className={styles.menu}>
        {project && (
          <Menu.Item className={styles.item}>
            <span className={styles.projectName}>{project.name}</span>
            {canEditProject && (
              <Button
                className={styles.editButton}
                onClick={handleProjectSettingsClick}
                size="mini"
                icon
              >
                <Icon fitted name="pencil" />
              </Button>
            )}
          </Menu.Item>
        )}

        {/* Navigation Items */}
        <Menu.Item as={Link} to={Paths.ROOT} className={styles.item}>
          <Icon name="home" /> Home
        </Menu.Item>

        {/* Favorites Section */}
        {withFavoritesToggler && (
          <div className={styles.favoritesSection}>
            <Menu.Item className={styles.itemHeader} onClick={handleToggleFavoritesClick}>
              Favorites <Icon name={isFavoritesEnabled ? 'angle down' : 'angle right'} />
            </Menu.Item>
            {isFavoritesEnabled && (
              <div className={styles.favoritesContent}>
                <Favorites />
              </div>
            )}
          </div>
        )}
      </Menu>

      <div className={styles.footer}>
        {withEditModeToggler && (
          <div
            className={classNames(styles.footerItem, isEditModeEnabled && styles.active)}
            onClick={handleToggleEditModeClick}
            title="Toggle Edit Mode"
          >
            <Icon fitted name={isEditModeEnabled ? 'unlock' : 'lock'} />
          </div>
        )}

        <NotificationsPopup>
          <div className={styles.footerItem}>
            <Icon fitted name="bell" />
            {notificationIds.length > 0 && (
              <span className={styles.notification}>{notificationIds.length}</span>
            )}
          </div>
        </NotificationsPopup>

        <UserActionsPopup>
          <div className={classNames(styles.footerItem, styles.userProfile)}>
            <UserAvatar id={user.id} size="small" />
          </div>
        </UserActionsPopup>
      </div>
    </div>
  );
});

export default Sidebar;
