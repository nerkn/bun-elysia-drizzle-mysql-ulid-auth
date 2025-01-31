import { eq } from "drizzle-orm";
import db from "../db/drizzle";
import {
  User,
  UserAddRole,
  UserCreate,
  UserZod,
  UsersTable,
} from "./user.entity";
import { Redis } from "../db";
import { logger } from "../log";
import { MyError } from "../error";
import { password } from "bun";

export class UsersHandlers {
  resetPassword(resetId: string, password: string) {
    throw new Error("Method not implemented.");
  }
  private log;
  private myError;
  private redis;

  constructor(isLog = true) {
    if (isLog) {
      this.log = logger.child({ service: UsersHandlers.name });
    }
    this.myError = new MyError(this.log);
    this.redis = new Redis();
  }
  //#region Get
  public async getAllUsers(): Promise<User[]> {
    this.log?.info("getAllUsers");
    try {
      const query = async () => db.select().from(UsersTable);
      return this.redis.cache("getAllUsers", 10, query);
    } catch (error) {
      throw this.myError.new("getAllUsers", 500, error);
    }
  }
  public async activateUser(activationId: string) {
    // TODO :
    this.log?.info("user tried to be activated");
    if (activationId) {
    }
  }
  public async getUserById(userId: string): Promise<User | null> {
    this.log?.info("getUserById");

    // Zod
    try {
      UserZod.pick({ id: true }).parse({ id: userId });
    } catch (error) {
      throw this.myError.new("getUserById", 400, error);
    }

    // Query
    try {
      const cacheUser: User = await this.redis.check(
        `getUserById:${userId}`,
        10
      );
      if (cacheUser) {
        return { ...cacheUser, createdAt: new Date(cacheUser.createdAt) };
      }

      const result = (
        await db.select().from(UsersTable).where(eq(UsersTable.id, userId))
      )[0];

      await this.redis.save(`getUserById:${userId}`, 10, result);

      return result;
    } catch (error) {
      throw this.myError.new("getUserById", 500, error);
    }
  }

  public async getUserByEmail(userEmail: string): Promise<User | null> {
    this.log?.info("getUserByEmail");

    // Zod
    try {
      UserZod.pick({ email: true }).parse({ email: userEmail });
    } catch (error) {
      throw this.myError.new("getUserByEmail", 400, error);
    }

    // Query
    try {
      const cacheUser: User = await this.redis.check(
        `getUserByEmail:${userEmail}`,
        10
      );
      if (cacheUser) {
        return { ...cacheUser, createdAt: new Date(cacheUser.createdAt) };
      }

      const result = (
        await db
          .select()
          .from(UsersTable)
          .where(eq(UsersTable.email, userEmail))
      )[0];

      await this.redis.save(`getUserByEmail:${userEmail}`, 10, result);

      return result;
    } catch (error) {
      throw this.myError.new("getUserByEmail", 500, error);
    }
  }
  //#endregion Get

  //#region Create
  public async createUser(dto: UserCreate): Promise<User> {
    this.log?.info("createUser");

    // Zod
    try {
      UserZod.pick({ name: true, email: true, password: true }).parse(dto);
    } catch (error) {
      throw this.myError.new("createUser", 400, error);
    }

    // Query
    try {
      await db.insert(UsersTable).values([{ ...dto }]);

      let result = await db
        .select()
        .from(UsersTable)
        .where(eq(UsersTable.email, dto.email));
      if (result.length) return result[0];

      throw this.myError.new("createUser", 500, "user fetch failed");
    } catch (error) {
      throw this.myError.new("createUser", 500, error);
    }
  }
  //#endregion Create

  //#region Update
  public async addRoleToUser(dto: UserAddRole): Promise<User> {
    this.log?.info("addRoleToUser");

    // Zod
    try {
      UserZod.pick({ id: true, role: true }).parse(dto);
    } catch (error) {
      throw this.myError.new("addRoleToUser", 400, error);
    }

    // Check
    const user = await this.getUserById(dto.id);

    // Query
    try {
      await db.update(UsersTable).set(dto).where(eq(UsersTable.id, dto.id));
      let result = await db
        .select()
        .from(UsersTable)
        .where(eq(UsersTable.id, dto.id));
      return result[0];
    } catch (error) {
      throw this.myError.new("addRoleToUser", 500, error);
    }
  }
  //#endregion

  //#region Delete
  public async deleteUser(userId: string): Promise<User | null> {
    this.log?.info("deleteUser");

    // Zod
    try {
      UserZod.pick({ id: true }).parse({ id: userId });
    } catch (error) {
      throw this.myError.new("addRoleToUser", 400, error);
    }

    // Query
    try {
      const result = await db
        .delete(UsersTable)
        .where(eq(UsersTable.id, userId));
      return null;
    } catch (error) {
      throw this.myError.new("deleteUser", 500, error);
    }
  }
  //#endregion Delete
}
