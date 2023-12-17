import {
  mysqlTable,
  timestamp,
  uniqueIndex,
  char,
  index,
  varchar,
} from "drizzle-orm/mysql-core";
import { UsersTable } from "../users/user.entity";
import { relations } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { ulid } from "ulidx";

export const TokensTable = mysqlTable(
  "tokens",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => ulid()),
    uniqueId: char("uniqueId", { length: 21 }).notNull(),
    token: varchar("token", { length: 36 })
      .unique()
      .notNull()
      .$defaultFn(() => ulid()),
    userId: varchar("userId", { length: 36 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      tokenIdx: uniqueIndex("token_idx").on(table.token),
      userIdIdx: index("userId_idx").on(table.userId),
      uniqueIdIdx: uniqueIndex("uniqueId_idx").on(table.uniqueId, table.userId),
    };
  }
);

export const TokensRelations = relations(TokensTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [TokensTable.userId],
    references: [UsersTable.id],
  }),
}));

export const TokenZod = createSelectSchema(TokensTable, {
  uniqueId: (schema) => schema.uniqueId.length(21),
});
