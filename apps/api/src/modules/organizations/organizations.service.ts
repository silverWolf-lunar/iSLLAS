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

  async createOffice(dto: any): Promise<Office> {
    const office = this.officeRepo.create({
      name: dto.name,
      code: dto.code,
      level: dto.level,
      provinceId: dto.provinceId || null,
      address: dto.address || null,
      email: dto.email || null,
      phoneNumber: dto.phoneNumber || null,
      isActive: true,
    });
    return this.officeRepo.save(office);
  }

  async updateOffice(id: string, dto: any): Promise<Office> {
    const office = await this.getOfficeById(id);
    if (dto.name !== undefined) office.name = dto.name;
    if (dto.level !== undefined) office.level = dto.level;
    if (dto.provinceId !== undefined) office.provinceId = dto.provinceId || null;
    if (dto.address !== undefined) office.address = dto.address || null;
    if (dto.email !== undefined) office.email = dto.email || null;
    if (dto.phoneNumber !== undefined) office.phoneNumber = dto.phoneNumber || null;
    if (dto.isActive !== undefined) office.isActive = dto.isActive;
    return this.officeRepo.save(office);
  }
}

