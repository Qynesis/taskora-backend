import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameCategoryNames1777467275494 implements MigrationInterface {
  name = 'RenameCategoryNames1777467275494';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const renames: [string, string][] = [
      ['Solar Panel',                                   'Solar Panel Installation'],
      ['Security Camera & Access Systems Installation', 'Security Camera & Access Systems'],
      ['Cleaning (Domestic)',                           'Domestic Cleaning'],
      ['Cleaning (Specialized/Commercial)',             'Commercial / Specialized Cleaning'],
      ['Graphics Designers',                            'Graphics Design'],
      ['Network setup',                                 'ICT Network Setup'],
      ['Data, Network & Communications',                'Data & Communications'],
      ['Professional entetainer',                       'Professional Entertainer'],
      ['TV mount',                                      'TV Mount'],
      ['Wall and flooring',                             'Wall and Flooring'],
      ['Pool repairs and Cleaning',                     'Pool Repairs and Cleaning'],
      ['Event driver (Wedding & Formal Event)',         'Event Driver (Wedding & Formal Event)'],
      ['Event Co-ordinator',                            'Event Co-Ordinator'],
    ];

    for (const [from, to] of renames) {
      await queryRunner.query(
        `UPDATE service.categories SET name = $1 WHERE name = $2`,
        [to, from],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const renames: [string, string][] = [
      ['Solar Panel Installation',                'Solar Panel'],
      ['Security Camera & Access Systems',        'Security Camera & Access Systems Installation'],
      ['Domestic Cleaning',                       'Cleaning (Domestic)'],
      ['Commercial / Specialized Cleaning',       'Cleaning (Specialized/Commercial)'],
      ['Graphics Design',                         'Graphics Designers'],
      ['ICT Network Setup',                       'Network setup'],
      ['Data & Communications',                   'Data, Network & Communications'],
      ['Professional Entertainer',                'Professional entetainer'],
      ['TV Mount',                                'TV mount'],
      ['Wall and Flooring',                       'Wall and flooring'],
      ['Pool Repairs and Cleaning',               'Pool repairs and Cleaning'],
      ['Event Driver (Wedding & Formal Event)',   'Event driver (Wedding & Formal Event)'],
      ['Event Co-Ordinator',                      'Event Co-ordinator'],
    ];

    for (const [from, to] of renames) {
      await queryRunner.query(
        `UPDATE service.categories SET name = $1 WHERE name = $2`,
        [to, from],
      );
    }
  }
}
