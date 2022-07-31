import { DataType, newDb } from "pg-mem";
import { describe, it, expect } from "vitest";

describe("Minimal reproduction of missing feature in pg-mem: views are not updatable", () => {
  const database = newDb();

  it("initialize user table", () => {
    database.public.declareTable({
      name: "users",
      fields: [
        { name: "id", type: DataType.text },
        { name: "name", type: DataType.text },
      ],
    });
  });

  it("insert a row", () => {
    const insertedUsers = database.public.many(`
    INSERT INTO users (id, name)
    VALUES ('1', 'Bruce Wayne');

    SELECT * FROM users;
    `);

    expect(insertedUsers.map(({ id, name }) => ({ id, name }))).toEqual([
      { id: "1", name: "Bruce Wayne" },
    ]);
  });

  it("create simple view", () => {
    database.public.none(`
  CREATE VIEW users_view AS SELECT * FROM users`);
  });

  it("select works fine from the view", () => {
    const users = database.public.many(`
    SELECT * FROM users_view;
    `);

    expect(users.map(({ id, name }) => ({ id, name }))).toEqual([
      { id: "1", name: "Bruce Wayne" },
    ]);
  });

  it("try to insert row in view - it fails", () => {
    expect(() =>
      database.public.many(`
    INSERT INTO users_view (id, name)
    VALUES ('1', 'Bruce Wayne');
    `)
    ).toThrowErrorMatchingInlineSnapshot(`
      "\\"users_view\\" is not a table

      🐜 This seems to be an execution error, which means that your request syntax seems okay,
          but the resulting statement cannot be executed → Probably not a pg-mem error.

      *️⃣ Failed SQL statement: 
          INSERT INTO users_view (id, name)
          VALUES ('1', 'Bruce Wayne');
          ;

      👉 You can file an issue at https://github.com/oguimbal/pg-mem along with a way to reproduce this error (if you can), and  the stacktrace:

      "
    `);
  });
});
