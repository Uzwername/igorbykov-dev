import { getById } from '@/utils/html';

describe('getById', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns the element with the given id', () => {
    const element = document.createElement('div');
    element.id = 'target';
    document.body.append(element);

    expect(getById('target')).toBe(element);
  });

  it('returns the matching element when several elements exist', () => {
    const first = document.createElement('div');
    first.id = 'first';
    const second = document.createElement('div');
    second.id = 'second';
    document.body.append(first, second);

    expect(getById('second')).toBe(second);
  });

  it('throws a descriptive error when no element has the given id', () => {
    const testId = 'missing';

    expect(() => getById(testId)).toThrow(testId);
  });
});
