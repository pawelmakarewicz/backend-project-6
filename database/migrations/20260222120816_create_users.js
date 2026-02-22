// Knex up() при `migrate:latest` и down() при `migrate:rollback`

export const up = async (knex) => {
  await knex.schema.createTable('users', (table) => {
    table.increments('id')
    table.string('first_name').notNullable()
    table.string('last_name').notNullable()
    table.string('email').notNullable().unique()
    table.string('password_hash').notNullable()
    table.timestamps(true, true)
  })
}

export const down = async (knex) => {
  await knex.schema.dropTable('users')
}
