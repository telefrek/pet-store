/**
 * This package contains the petstore service api
 */

import { getDebugInfo } from "@telefrek/core";
import {
  DefaultLogger,
  LogLevel,
  info,
  type Logger,
} from "@telefrek/core/logging";
import { HttpMethod, HttpStatusCode } from "@telefrek/http";
import { SerializationFormat, type ServiceResponse } from "@telefrek/service";
import { routableApi, route } from "@telefrek/service/decorators";
import { OrderStore } from "./dataAccess/orders.js";
import { Order } from "./entities.js";

@routableApi({ pathPrefix: "/pet" })
export class PetApi {}

/**
 * The {@link RoutableApi} for handling the ordre store
 */
@routableApi({ pathPrefix: "/store", format: SerializationFormat.JSON })
export class StoreApi {
  readonly #orderStore: OrderStore;
  readonly _log: Logger;

  /**
   * Ctor for the {@link StoreApi}
   *
   * @param orderStore The {@link OrderStore} to use
   */
  constructor(orderStore: OrderStore) {
    this.#orderStore = orderStore;
    this._log = new DefaultLogger({
      name: "OrderApi",
      level: LogLevel.WARN,
    });
  }

  /**
   * Places an order
   *
   * @param order The {@link Order} to place
   * @returns The accepted {@link Order} object
   */
  @route({
    template: "/order",
    method: HttpMethod.POST,
    format: SerializationFormat.JSON,
    mapping: (_, body) => {
      info(`Received p=${_}, body=${getDebugInfo(body)}`);
      return [body];
    },
  })
  async placeOrder(order: Omit<Order, "id">): Promise<ServiceResponse<Order>> {
    try {
      return await this.#orderStore.createOrder(order);
    } catch (err) {
      this._log.error(`Error during order creation: ${err}`, err);
      return {
        code: HttpStatusCode.INTERNAL_SERVER_ERROR,
      };
    }
  }

  @route({
    template: "/order/:orderId",
    method: HttpMethod.GET,
    mapping: (parameters, _) => [parameters.get("orderId")],
  })
  getOrder(orderId: number): Promise<Order | undefined> {
    return this.#orderStore.getOrderById(orderId);
  }

  @route({
    template: "/order/:orderId",
    method: HttpMethod.DELETE,
    mapping: (parameters, _) => [parameters.get("orderId")],
  })
  async deleteOrder(orderId: number): Promise<void> {
    if (await this.#orderStore.getOrderById(orderId)) {
      return Promise.resolve(undefined);
    }

    return Promise.resolve(undefined);
  }

  /**
   * Find the inventory for the store
   *
   * @returns The current inventory volumes
   */
  @route({
    template: "/inventory",
    method: HttpMethod.GET,
    format: SerializationFormat.JSON,
  })
  getInventory(): Promise<Record<string, number>> {
    return Promise.resolve({
      colleenIsAwesome: 3,
    });
  }
}

@routableApi({ pathPrefix: "/user" })
export class UserApi {}
