import { Base64 } from '../src/encoders';

describe('Base64', () => {
  it('works', () => {
    expect(Base64.parse('Hello, World!').toString()).toEqual(
      '1de965a00016a2b95d'
    );
  });
});
