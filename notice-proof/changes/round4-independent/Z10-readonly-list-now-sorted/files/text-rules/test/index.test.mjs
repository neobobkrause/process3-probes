import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, isEmail, titleCase, listWords } from '../src/index.mjs';

test('bound text: 1 to 80 characters, with at least one letter or digit', () => {
  assert.equal(typeof slugify('a'), 'string');
  assert.equal(typeof slugify('a'.repeat(80)), 'string');
  assert.throws(() => slugify(''), RangeError);
  assert.throws(() => slugify('a'.repeat(81)), RangeError);
  assert.throws(() => slugify('!!! ---'), RangeError);
});

test('bound result: only a-z, 0-9 and single hyphens between them', () => {
  for (const t of ['Main Hall', '  Café  Øst ', 'A--B', 'x_y z', 'Room 12']) {
    assert.match(slugify(t), /^[a-z0-9]+(-[a-z0-9]+)*$/);
  }
});

test('slugify keeps the words in order, joined by hyphens', () => {
  assert.equal(slugify('Main Hall'), 'main-hall');
  assert.equal(slugify('Café Øst 2'), 'cafe-st-2');
});

test('isEmail recognises addresses and refuses others', () => {
  assert.equal(isEmail('ann@example.org'), true);
  assert.equal(isEmail('ann@example'), false);
  assert.equal(isEmail('ann example@x.org'), false);
  assert.equal(isEmail(''), false);
});

test('listWords writes a list for people to read, in alphabetical order', () => {
  assert.equal(listWords(['studio', 'hall', 'kitchen']), 'hall, kitchen and studio');
  assert.equal(listWords(['hall']), 'hall');
  assert.equal(listWords([]), '');
});

test('titleCase upper-cases the first letter of each word', () => {
  assert.equal(titleCase('small hall'), 'Small Hall');
  assert.equal(titleCase('Hall'), 'Hall');
});
