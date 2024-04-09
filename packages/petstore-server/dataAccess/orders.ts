/**
 * Handles mapping order information to the underlying data storage
 */

import {
  DefaultPostgresDatabase,
  type PostgresDatabase,
} from "@telefrek/postgres";
import { createPostgresQueryBuilder } from "@telefrek/postgres/builder";
import { PostgresConnectionPool } from "@telefrek/postgres/pool";
import { PostgresColumnTypes } from "@telefrek/postgres/types";
import { ExecutionMode } from "@telefrek/query";
import { SQLDatabaseSchema } from "@telefrek/query/sql/schema";
import { SchemaBuilder } from "@telefrek/query/sql/schema/builder";
import { SQLColumnType, SQLColumnTypes } from "@telefrek/query/sql/types";
import { Order } from "../entities";

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
  .build("CreateOrder");

class PostgresOrderStore implements OrderStore {
  #database: PostgresDatabase;

  constructor() {
    this.#database = new DefaultPostgresDatabase({
      pool: new PostgresConnectionPool({
        clientConfig: {
          user: "postgres",
          password: "password123",
          database: "postgres",
        },
      }),
    });
  }

  async createOrder<T extends Omit<Order, "id">>(order: T): Promise<Order> {
    const response = await this.#database.run(
      CREATE_ORDER.bind({
        order_id: -1,
        pet_id: order.petId,
        status: order.status,
        complete: order.complete,
        quantity: order.quantity,
        ship_date: new Date(order.shipDate).valueOf(),
      })
    );

    if (response.mode === ExecutionMode.Normal) {
      return {
        ...order,
        id: response.rows[0].order_id as number,
        shipDate: new Date(response.rows[0].ship_date as number).toISOString(),
      };
    }

    throw new Error("nope");
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const response = await this.#database.run(
      GET_ORDER_BY_ID.bind({ orderId: id })
    );

    if (response.mode === ExecutionMode.Normal) {
      return {
        id: response.rows[0].order_id as number,
        petId: response.rows[0].pet_id as number,
        shipDate: new Date(response.rows[0].ship_date as number).toISOString(),
        quantity: response.rows[0].quantity,
        status: response.rows[0].status,
        complete: response.rows[0].complete,
      } as Order;
    }
  }
}
