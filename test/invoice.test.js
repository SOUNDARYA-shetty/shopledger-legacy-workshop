'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

test('invoice uses the HSN slab applied at checkout', function () {
  var items = [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 100, qty: 1 }];
  var billed = pricing.computeTotals(items, '');
  var order = {
    id: 1001,
    items: items,
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  };

  var figures = invoice.computeInvoiceFigures(order);

  assert.equal(billed.tax, 5);
  assert.equal(billed.total, 105);
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.tax, billed.tax);
  assert.equal(figures.total, billed.total);
  assert.doesNotMatch(invoice.render(order), /differs from Order Ledger recorded total/);
});

test('invoice matches checkout GST for a decimal item rate and stored order totals', function () {
  var items = [{ name: 'Staples', price: 100, qty: 1, gstRate: 0.05 }];
  var billed = pricing.computeTotals(items, '');
  var order = {
    id: 1002,
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total,
    items: items
  };

  var figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    { subtotal: figures.subtotal, discount: figures.discount, tax: figures.tax, total: figures.total },
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, total: billed.total }
  );
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.doesNotMatch(invoice.render(order), /differs from Order Ledger recorded total/);
});

test('invoice applies the checkout coupon and post-discount GST calculation', function () {
  var items = [{ id: 2, name: 'Rice', hsn: '1006', price: 500, qty: 1 }];
  var billed = pricing.computeTotals(items, 'SAVE10');
  var order = {
    id: 1003,
    coupon: 'SAVE10',
    items: items,
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  };

  var figures = invoice.computeInvoiceFigures(order);

  assert.equal(billed.discount, 50);
  assert.equal(figures.discount, billed.discount);
  assert.equal(figures.tax, billed.tax);
  assert.equal(billed.total, 472.5);
  assert.equal(figures.total, billed.total);
});
