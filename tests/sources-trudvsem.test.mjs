/**
 * v1.29.0 — Trudvsem adapter (Russian government open-data API).
 *
 * Real network is forbidden (CI-isolation). We hand-craft a `fetchImpl`
 * that returns the documented Trudvsem v1 JSON shape; the test asserts
 * normalization + onlyRemote filtering + error propagation.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { searchTrudvsem, normalizeTrudvsem } from '../server/lib/sources/trudvsem.mjs';

function mkFetch(payload, status = 200) {
  return async () =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json' },
    });
}

test('searchTrudvsem normalizes a vacancy record to the common shape', async () => {
  const fetchImpl = mkFetch({
    status: 200,
    results: {
      vacancies: [
        {
          vacancy: {
            id: '12345',
            'job-name': 'Senior PHP Developer',
            vac_url: 'https://trudvsem.ru/vacancy/12345',
            'creation-date': '2026-05-10',
            schedule: 'Полный день',
            'work-places': '1',
            salary_min: 200000,
            salary_max: 350000,
            currency: 'RUB',
            company: { name: 'ООО Рога и Копыта' },
            region: { name: 'Москва' },
            duty: 'PHP/Symfony, code review, mentoring',
          },
        },
      ],
    },
  });

  const out = await searchTrudvsem('Senior PHP', { fetchImpl });
  assert.equal(out.length, 1);
  const j = out[0];
  assert.equal(j.id, 'trudvsem-12345');
  assert.equal(j.title, 'Senior PHP Developer');
  assert.equal(j.company, 'ООО Рога и Копыта');
  assert.equal(j.url, 'https://trudvsem.ru/vacancy/12345');
  assert.equal(j.salary, 'от 200000 до 350000 RUB');
  assert.equal(j.location, 'Москва');
  assert.equal(j.isRemote, false);
  assert.equal(j.source, 'trudvsem');
});

test('searchTrudvsem treats "удалённо" in schedule as remote', async () => {
  const fetchImpl = mkFetch({
    status: 200,
    results: {
      vacancies: [{
        vacancy: {
          id: 'r1',
          'job-name': 'Backend Engineer',
          vac_url: 'https://trudvsem.ru/vacancy/r1',
          schedule: 'Удалённая работа',
          company: { name: 'Acme' },
          region: { name: 'Россия' },
        },
      }],
    },
  });
  const out = await searchTrudvsem('Backend', { fetchImpl });
  assert.equal(out.length, 1);
  assert.equal(out[0].isRemote, true);
  assert.equal(out[0].workplaceType, 'Remote');
});

test('searchTrudvsem onlyRemote filter drops non-remote entries', async () => {
  const fetchImpl = mkFetch({
    status: 200,
    results: {
      vacancies: [
        { vacancy: { id: '1', 'job-name': 'A', schedule: 'удалённо', company: { name: 'X' } } },
        { vacancy: { id: '2', 'job-name': 'B', schedule: 'офис', company: { name: 'Y' } } },
      ],
    },
  });
  const out = await searchTrudvsem('q', { fetchImpl, onlyRemote: true });
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 'trudvsem-1');
});

test('searchTrudvsem throws on 5xx (caller decides to log + continue)', async () => {
  const fetchImpl = mkFetch({}, 503);
  await assert.rejects(
    () => searchTrudvsem('q', { fetchImpl }),
    /Trudvsem: HTTP 503/,
  );
});

test('searchTrudvsem returns [] on empty results object (no throw)', async () => {
  const fetchImpl = mkFetch({ status: 200, results: { vacancies: [] } });
  const out = await searchTrudvsem('q', { fetchImpl });
  assert.deepEqual(out, []);
});

test('normalizeTrudvsem skips records with no title', () => {
  assert.equal(normalizeTrudvsem({ vacancy: { id: 'x' } }), null);
  assert.equal(normalizeTrudvsem(null), null);
  assert.equal(normalizeTrudvsem({}), null);
});
