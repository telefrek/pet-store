/**
 * Handles mapping order information to the underlying data storage
 */

import type { MaybeAwaitable } from "@telefrek/core";
import { DefaultLogger, LogLevel, type Logger } from "@telefrek/core/logging";
import { delay } from "@telefrek/core/time";
import {
  DefaultPostgresDatabase,
  type PostgresDatabase,
} from "@telefrek/postgres";
import { createPostgresQueryBuilder } from "@telefrek/postgres/builder";
import { PostgresConnectionPool } from "@telefrek/postgres/pool";
import { PostgresColumnTypes } from "@telefrek/postgres/types";
import { ExecutionMode } from "@telefrek/query";
import { SQLDatabaseSchema } from "@telefrek/query/sql/schema";
import { SchemaBuilder } from "@telefrek/query/sql/schemaBuilder";
import { SQLColumnType, SQLColumnTypes } from "@telefrek/query/sql/types";
import { Order } from "../entities.js";

const OrderStatus = {
  PLACED: "placed",
  APPROVED: "approved",
  DELIVERED: "delivered",
} as const;

const OrderTable = {
  order_id: PostgresColumnTypes.bigserial(),
  pet_id: SQLColumnTypes.of(SQLColumnType.BIGINT),
  quantity: SQLColumnTypes.of(SQLColumnType.INT),
  ship_date: SQLColumnTypes.of(SQLColumnType.TIMESTAMP),
  status: SQLColumnTypes.enum(OrderStatus),
  complete: SQLColumnTypes.of(SQLColumnType.BIT),
};

export const PetStoreDatabase = new SchemaBuilder()
  .withTable(OrderTable, "orders", { column: "order_id" })
  .build();

export interface OrderStore {
  getOrderById(id: number): Promise<Order | undefined>;

  createOrder<T extends Omit<Order, "id">>(order: T): Promise<Order>;

  close(): MaybeAwaitable<void>;
}

export function createOrderStore(): OrderStore {
  return new PostgresOrderStore();
}

export const createStore = createPostgresQueryBuilder<
  SQLDatabaseSchema<typeof PetStoreDatabase>
>;

const GET_ORDER_BY_ID = createStore()
  .withParameters<{ orderId: number }>()
  .select("orders")
  .columns("*")
  .where((b) => b.eq("order_id", "orderId"))
  .build("GetOrderById");

const CREATE_ORDER = createStore()
  .insert("orders")
  .returning("order_id", "ship_date")
  .columns("pet_id", "status", "quantity", "complete")
  .build("CreateOrder");

class PostgresOrderStore implements OrderStore {
  private _database: PostgresDatabase;
  private _log: Logger = new DefaultLogger({
    name: "OrderStore",
    level: LogLevel.WARN,
  });

  constructor() {
    this._database = new DefaultPostgresDatabase({
      pool: new PostgresConnectionPool({
        name: "OrderStore",
        clientConfig: {
          user: "postgres",
          password: "password123",
          database: "postgres",
          host: process.env.PG_HOST ?? "0.0.0.0",
        },
        initialSize: 2,
        maximumSize: 8,
        defaultTimeoutMs: 50,
      }),
      defaultTimeoutMilliseconds: 50,
      maxParallelism: 8,
    });
  }

  async close(): Promise<void> {
    await this._database.close();
  }

  async createOrder<T extends Omit<Order, "id">>(order: T): Promise<Order> {
    this._log.info(`Creating order...`);

    const response = await this._database.run(
      CREATE_ORDER.bind({
        pet_id: order.petId,
        status: order.status,
        complete: order.complete,
        quantity: order.quantity,
      })
    );

    if (response.mode === ExecutionMode.Normal) {
      this._log.info(`Created order ${response.rows[0].order_id}`);
      return {
        ...order,
        id: response.rows[0].order_id as number,
        shipDate: new Date(response.rows[0].ship_date as number).toISOString(),
      };
    }

    throw new Error("nope");
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    this._log.info(`Getting order by id: ${id}...`);
    try {
      await delay(25);
      const response = await this._database.run(
        GET_ORDER_BY_ID.bind({ orderId: id })
      );

      if (response.mode === ExecutionMode.Normal && response.rows.length > 0) {
        this._log.info(
          `Found ${response.rows.length && response.rows.length > 0} matching objects!`
        );

        return {
          id: response.rows[0].order_id as number,
          petId: response.rows[0].pet_id as number,
          shipDate: new Date(
            response.rows[0].ship_date as number
          ).toISOString(),
          quantity: response.rows[0].quantity,
          status: response.rows[0].status,
          complete: response.rows[0].complete,
        } as Order;
      } else {
        this._log.info(`Failed to retrieve a response`);
      }
    } catch (err) {
      this._log.error(`Failed to get response: ${err}`, err);
    }
  }
}
