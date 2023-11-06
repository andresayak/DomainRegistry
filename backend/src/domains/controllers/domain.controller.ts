import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DomainEntity } from '../entities';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChainIdPipe } from '../../common/chainId.pipe';

@Controller('domains/:chainId')
@ApiTags('Domains operations')
export class DomainController {
  constructor(
    @InjectRepository(DomainEntity)
    private readonly domainRepository: Repository<DomainEntity>,
  ) {}

  @Get()
  top(@Param('chainId', ChainIdPipe) chainId: number): Promise<DomainEntity[]> {
    return this.domainRepository.find({
      where: {
        chainId,
        parentId: IsNull(),
        finishedAt: MoreThan(new Date())
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  @Get('soon-to-expire')
  soon(
    @Param('chainId', ChainIdPipe) chainId: number,
  ): Promise<DomainEntity[]> {
    return this.domainRepository.find({
      where: {
        chainId,
        finishedAt: MoreThan(new Date()),
      },
      order: {
        finishedAt: 'ASC',
      },
    });
  }

  @Get(':name')
  async info(
    @Param('chainId', ChainIdPipe) chainId: number,
    @Param('name') name: string,
  ): Promise<DomainEntity> {
    const domain = await this.domainRepository.findOneBy({
      chainId,
      name,
    });
    if (!domain) {
      throw new NotFoundException();
    }
    return domain;
  }

  @Get(':name/children')
  async children(
    @Param('chainId', ChainIdPipe) chainId: number,
    @Param('name') name: string,
  ): Promise<DomainEntity[]> {
    const domain = await this.domainRepository.findOneBy({
      chainId,
      name,
    });
    if (!domain) {
      throw new NotFoundException();
    }
    return this.domainRepository.find({
      where: {
        parentId: domain.id,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  @Get('byOwner/:owner')
  async byAccount(
    @Param('chainId', ChainIdPipe) chainId: number,
    @Param('owner') owner: string,
  ): Promise<DomainEntity[]> {
    return this.domainRepository
      .createQueryBuilder()
      .where({
        chainId,
      })
      .andWhere('LOWER(owner) = :owner', { owner: owner.toLowerCase() })
      .orderBy({
        created_at: 'DESC',
      })
      .getMany();
  }
}
