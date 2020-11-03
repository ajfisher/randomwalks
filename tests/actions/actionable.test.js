import {jest} from '@jest/globals';

import Actionable from '../../src/lib/actions/actionable.js';

describe('1. Actionable abstract class should have certain base values', () => {
  test('1.1. Actionable should have basic defaults set', () => {
    const actionable = new Actionable();

    expect(actionable.height).toBeDefined();
    expect(actionable.width).toBeDefined();
    expect(actionable.alpha).toBeDefined();
    expect(actionable.translate).toBeDefined();
    expect(actionable.rotate).toBeDefined();
    expect(actionable.t).toBeDefined();
    expect(actionable.op_order).toBeDefined();

    // also test the translate object
    const { translate } = actionable;
    expect(translate.x).toBeDefined();
    expect(translate.y).toBeDefined();
  });

  test('1.2 Setting option values of Actionable constructor should stick', () => {
    const opts = {
      height: 10,
      width: 10,
      alpha: 0.2,
      translate: {x: 5, y: 5},
      rotate: 0.7,
      t: 100,
      op_order: 'RT'
    };

    const actionable = new Actionable(opts);

    expect(actionable.height).toEqual(opts.height);
    expect(actionable.width).toEqual(opts.height);
    expect(actionable.alpha).toEqual(opts.alpha);
    expect(actionable.translate).toEqual(opts.translate);
    expect(actionable.rotate).toEqual(opts.rotate);
    expect(actionable.t).toEqual(opts.t);
    expect(actionable.op_order).toEqual(opts.op_order);
  });
});

describe('2. Actionable.draw() should take global actions', () => {
  test('2.1. Actionable.draw should set global alpha, rotation and translation on context', () => {
    const mockContext = {
      translate: jest.fn(),
      rotate: jest.fn()
    };
    Object.defineProperty(mockContext, 'globalAlpha', {
      set: (v) => { mockContext._alpha = v },
      get: () => mockContext._alpha
    });

    const actionable = new Actionable();
    actionable.draw(mockContext);

    expect(mockContext.translate).toHaveBeenCalled();
    expect(mockContext.rotate).toHaveBeenCalled();
    expect(mockContext.globalAlpha).toBeDefined();
  });
});
