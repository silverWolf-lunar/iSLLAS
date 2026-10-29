import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Office } from './office.entity';
import { AdminArea } from './admin-area.entity';
import { AdminAreaLevel } from '@sllas/contracts';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Office)
    private readonly officeRepo: Repository<Office>,
    @InjectRepository(AdminArea)
    private readonly adminAreaRepo: Repository<AdminArea>,
  ) {}

  async listOffices(): Promise<Office[]> {
    return this.officeRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getOfficeById(id: string): Promise<Office> {
    const office = await this.officeRepo.findOne({ where: { id } });
    if (!office) {
      throw new NotFoundException(`Office with ID ${id} not found`);
    }
    return office;
  }

  async listProvinces(): Promise<AdminArea[]> {
    return this.adminAreaRepo.find({
      where: { level: AdminAreaLevel.PROVINCE },
      order: { name: 'ASC' },
    });
  }

  async listDistricts(provinceId?: string): Promise<AdminArea[]> {
    const where: any = { level: AdminAreaLevel.DISTRICT };
    if (provinceId) {
      where.parentId = provinceId;
    }
    return this.adminAreaRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }
}
