import { Order } from '../../constant';

export const sortAttribute = (
  sortBy: string,
  sortShape?: string
): Record<string, 0 | 1 | -1> => {
  if (!sortBy) return {};

  let sortKey = sortBy;
  let sortOrder: Order = Order.ASC;

  if (sortBy.includes('-')) {
    sortKey = sortBy.split('-')[1];
    sortOrder = Order.DESC;
  }

  function changeDeepestKey(object: any) {
    const key = Object.keys(object)[0];

    if (object[key] === true) {
      object[key] = sortOrder;
    } else {
      changeDeepestKey(object[key]);
    }
  }

  if (sortShape) {
    if (sortShape[sortKey]) {
      changeDeepestKey(sortShape[sortKey]);

      return sortShape[sortKey];
    }

    return null;
  }

  return { [sortKey]: sortOrder };
};
