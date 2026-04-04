/**
 * Generic Proto Helper for normalizing gRPC responses.
 * Proto3 wire format omits default values (empty arrays, undefined optionals),
 * so we need to normalize the data after receiving it from gRPC.
 *
 * @example
 * // Define defaults schema
 * const teacherDefaults = {
 *   addresses: [],
 *   deletedAt: null,
 * };
 *
 * // Normalize single item
 * const normalized = ProtoHelper.normalize<Teacher>(data, teacherDefaults);
 *
 * // Normalize array
 * const normalizedMany = ProtoHelper.normalizeMany<Teacher>(items, teacherDefaults);
 *
 * // With nested objects
 * const result = ProtoHelper.normalize<Order>(order, {
 *   defaults: { items: [], deletedAt: null },
 *   nested: {
 *     items: { defaults: { discounts: [], deletedAt: null } }
 *   }
 * });
 */

export type DefaultsSchema<T> = Partial<{
  [K in keyof T]: T[K] extends Array<infer U>
    ? U[]
    : T[K] extends object | undefined
    ? T[K] | null
    : T[K] | null;
}>;

export type NestedDefaults<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? { defaults?: DefaultsSchema<U>; nested?: NestedDefaults<U> }
    : T[K] extends object | undefined
    ? {
        defaults?: DefaultsSchema<NonNullable<T[K]>>;
        nested?: NestedDefaults<NonNullable<T[K]>>;
      }
    : never;
};

export interface ProtoNormalizeOptions<T> {
  /** Default values for fields that may be omitted by proto3 */
  defaults?: DefaultsSchema<T>;
  /** Nested object configuration for recursive normalization */
  nested?: NestedDefaults<T>;
}

export const ProtoHelper = {
  /**
   * Normalize a single proto object by applying default values
   */
  normalize<T extends object>(
    data: T | undefined | null,
    options: ProtoNormalizeOptions<T> = {}
  ): T | null {
    if (!data) return null;

    const { defaults = {}, nested = {} } = options;
    const result = { ...data } as T;

    // Apply default values
    for (const [key, defaultValue] of Object.entries(defaults)) {
      const k = key as keyof T;
      if (result[k] === undefined || result[k] === null) {
        (result as Record<string, unknown>)[key] = defaultValue;
      }
    }

    // Handle nested arrays and objects
    for (const [key, nestedConfig] of Object.entries(nested)) {
      const k = key as keyof T;
      const value = result[k];
      const config = nestedConfig as {
        defaults?: DefaultsSchema<unknown>;
        nested?: NestedDefaults<unknown>;
      };

      if (Array.isArray(value)) {
        (result as Record<string, unknown>)[key] = value.map((item) =>
          this.normalize(
            item as object,
            config as ProtoNormalizeOptions<object>
          )
        );
      } else if (value && typeof value === 'object') {
        (result as Record<string, unknown>)[key] = this.normalize(
          value as object,
          config as ProtoNormalizeOptions<object>
        );
      }
    }

    return result;
  },

  /**
   * Normalize an array of proto objects
   */
  normalizeMany<T extends object>(
    data: T[] | undefined | null,
    options: ProtoNormalizeOptions<T> = {}
  ): T[] {
    if (!data) return [];
    return data.map((item) => this.normalize(item, options)!);
  },
};
