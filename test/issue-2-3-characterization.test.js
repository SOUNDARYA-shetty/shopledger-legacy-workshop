'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');
var ledger = require('../lib/ledger');

test('inventory allows selling the exact remaining sellable quantity', function () {
  var products = [{ id: 6, name: 'Ghee', stock: 1, reserved: 0 }];

  assert.deepEqual(inventory.check(products, [{ id: 6, qty: 1 }]), { ok: true });
});

test('cancellation restores physical stock for order item ids', function () {
  var db = {
    nextOrderId: 2,
    orders: [{ id: 1, status: 'pending', items: [{ id: 6, qty: 2 }], total: 0 }],
    products: [{ id: 6, stock: 3, reserved: 0 }]
  };

  assert.equal(orders.cancel(db, 1).ok, true);
  assert.equal(db.products[0].stock, 5);
  assert.equal(db.products[0].reserved, 0);
});

test('order history sorts chronologically and filters an inclusive date range', function () {
  var db = {
    orders: [
      { id: 1001, date: '28/12/2021' },
      { id: 1004, date: '30/01/2022' },
      { id: 1007, date: '04/03/2022' },
      { id: 1008, date: '15/03/2022' }
    ]
  };

  assert.deepEqual(orders.list(db).map(function (o) { return o.id; }), [1008, 1007, 1004, 1001]);
  assert.deepEqual(orders.list(db, { from: '2022-01-01', to: '2022-01-31' }).map(function (o) { return o.id; }), [1004]);
});

test('settlement amount from JSON is added numerically to customer totals', function () {
  var db = {
    nextSettlementId: 501,
    customers: [{
      id: 7,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200
    }],
    settlements: []
  };

  var result = ledger.recordSettlement(db, 7, '500', 'upi', '');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});
