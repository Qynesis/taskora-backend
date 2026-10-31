import { Entity, Column, Unique, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { ProviderSkill } from './provider-skill.entity';

@Entity('skills')
@Unique(['name'])
export class Skill extends BaseEntity {

    @Column({ name: 'name', type: 'varchar', length: 120 })
    name!: string;

    @OneToMany(() => ProviderSkill, (ps) => ps.skill)
    providerLinks!: ProviderSkill[];
}
