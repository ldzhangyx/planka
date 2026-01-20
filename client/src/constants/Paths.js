/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const ROOT = '/';
const LOGIN = '/login';
const OIDC_CALLBACK = '/oidc-callback';
const PROJECTS = '/projects/:id';
const BOARDS = '/boards/:id';
const PROJECT_CALENDAR = '/projects/:id/calendar';
const PROJECT_CALENDAR_CARD = '/projects/:projectId/calendar/cards/:cardId';
const CARDS = '/cards/:id';

export default {
  ROOT,
  LOGIN,
  OIDC_CALLBACK,
  PROJECTS,
  BOARDS,
  PROJECT_CALENDAR,
  PROJECT_CALENDAR_CARD,
  CARDS,
};
