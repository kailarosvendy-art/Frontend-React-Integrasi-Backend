import assert from 'node:assert/strict';
import test from 'node:test';
import { createOrderSchema, updateOrderStatusSchema } from './orderSchema.ts';

const order = {
  customerName: 'Customer Demo', phone: '+62 812-3456-7890', paymentMethod: 'cash',
  items: [{ menuId: 1, quantity: 2 }],
};

test('checkout normalizes phone and rejects client-controlled totals and user IDs', () => {
  const parsed = createOrderSchema.parse(order);
  assert.equal(parsed.phone, '6281234567890');
  assert.equal(parsed.note, '');
  for (const extra of [{ total: 1 }, { customerId: 99 }, { items: [{ menuId: 1, quantity: 1, price: 1 }] }]) {
    assert.equal(createOrderSchema.safeParse({ ...order, ...extra }).success, false);
  }
});

test('checkout rejects duplicate menus, empty carts, and invalid quantities', () => {
  for (const items of [[], [{ menuId: 1, quantity: 0 }], [{ menuId: 1, quantity: 21 }],
    [{ menuId: 1, quantity: 1 }, { menuId: 1, quantity: 2 }]]) {
    assert.equal(createOrderSchema.safeParse({ ...order, items }).success, false);
  }
  assert.equal(updateOrderStatusSchema.safeParse({ status: 'confirmed' }).success, false);
  assert.equal(updateOrderStatusSchema.safeParse({ status: 'completed' }).success, true);
});
