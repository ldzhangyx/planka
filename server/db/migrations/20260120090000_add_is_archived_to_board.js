/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

exports.up = async (knex) => {
  await knex.schema.alterTable('board', (table) => {
    /* Columns */

    table.boolean('is_archived').notNullable().defaultTo(false);
  });

  return knex.schema.alterTable('board', (table) => {
    table.boolean('is_archived').notNullable().alter();
  });
};

exports.down = (knex) =>
  knex.schema.table('board', (table) => {
    table.dropColumn('is_archived');
  });
