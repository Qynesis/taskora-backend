import { DataSource } from 'typeorm';
import { State } from '../entities/state.entity';
import { Suburb } from '../entities/suburb.entity';
import { SUBURBS_BY_STATE } from './data/australian-suburbs';

const STATES: { name: string; code: string }[] = [
  { name: 'Australian Capital Territory', code: 'ACT' },
  { name: 'New South Wales', code: 'NSW' },
  { name: 'Northern Territory', code: 'NT' },
  { name: 'Queensland', code: 'QLD' },
  { name: 'South Australia', code: 'SA' },
  { name: 'Tasmania', code: 'TAS' },
  { name: 'Victoria', code: 'VIC' },
  { name: 'Western Australia', code: 'WA' },
];

// Postgres caps a statement at 65535 bind parameters; at 3 columns per row this stays well
// under it while keeping the number of round trips small.
const INSERT_CHUNK = 1000;

export const seedLocations = async (dataSource: DataSource): Promise<void> => {
  const stateRepo = dataSource.getRepository(State);
  const suburbRepo = dataSource.getRepository(Suburb);

  let inserted = 0;
  let present = 0;

  for (const stateFields of STATES) {
    await stateRepo.upsert(stateFields, ['code']);
    const state = await stateRepo.findOneByOrFail({ code: stateFields.code });

    const suburbs = SUBURBS_BY_STATE[stateFields.code] ?? [];

    // Read the state's existing suburbs once rather than a lookup per row — at ~16k suburbs
    // the per-name approach meant roughly 32k round trips.
    //
    // Keyed on name + postcode, not name alone: a name is not unique within a state ("Back
    // Creek" is six distinct NSW localities on six postcodes). suburbs has no unique constraint
    // on (name, state_id, postcode), which is why this cannot be an upsert — there is no
    // conflict target — and why this Set is what makes the seed idempotent.
    const existing = new Set(
      (
        await suburbRepo.find({
          where: { stateId: state.id },
          select: { name: true, postcode: true },
        })
      ).map((s) => `${s.name}|${s.postcode ?? ''}`),
    );

    const missing = suburbs.filter((s) => !existing.has(`${s.name}|${s.postcode}`));
    present += suburbs.length - missing.length;

    for (let i = 0; i < missing.length; i += INSERT_CHUNK) {
      const chunk = missing
        .slice(i, i + INSERT_CHUNK)
        .map(({ name, postcode }) => ({ name, postcode, stateId: state.id }));
      await suburbRepo.insert(chunk);
      inserted += chunk.length;
    }
  }

  console.log(
    `✅ Locations seeded — ${STATES.length} states, ${inserted} suburbs inserted, ${present} already present`,
  );
};
