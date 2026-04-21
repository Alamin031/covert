import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ActivateWarrantyDto, WarrantyLookupDto } from './dto/warranty.dto';
import { WarrantyRecord } from './entities/warrantyrecord.entity';
import { WarrantyLog } from './entities/warrantylog.entity';

@Injectable()
export class WarrantyService {
  constructor(
    @InjectRepository(WarrantyRecord)
    private readonly warrantyRepo: Repository<WarrantyRecord>,
    @InjectRepository(WarrantyLog)
    private readonly logRepo: Repository<WarrantyLog>,
  ) {}

  private toJsonValue(data: unknown): any {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch {
      return { error: 'Could not serialize data' };
    }
  }

  async activate(dto: ActivateWarrantyDto, adminUsername?: string) {
    // Check for duplicate IMEI or serial
    if (dto.imei) {
      const exists = await this.warrantyRepo.findOne({
        where: { imei: dto.imei },
      });
      if (exists) {
        const log = this.logRepo.create({
          warrantyId: String(exists.id),
          action: 'create_skipped_duplicate',
          changes: this.toJsonValue({
            reason: 'duplicate_imei',
            attempted: dto,
          }),
          admin: adminUsername || 'system',
        });
        await this.logRepo.save(log);
        return {
          skipped: true,
          reason: 'duplicate_imei',
          existing: {
            ...exists,
            id: exists.id ? String(exists.id) : undefined,
          },
        };
      }
    }
    if (dto.serial) {
      const exists = await this.warrantyRepo.findOne({
        where: { serial: dto.serial },
      });
      if (exists) {
        const log = this.logRepo.create({
          warrantyId: String(exists.id),
          action: 'create_skipped_duplicate',
          changes: this.toJsonValue({
            reason: 'duplicate_serial',
            attempted: dto,
          }),
          admin: adminUsername || 'system',
        });
        await this.logRepo.save(log);
        return {
          skipped: true,
          reason: 'duplicate_serial',
          existing: {
            ...exists,
            id: exists.id ? String(exists.id) : undefined,
          },
        };
      }
    }
    const purchaseDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    const warranty: Partial<WarrantyRecord> = {
      ...dto,
      purchaseDate,
      expiryDate,
      status: 'active',
      activatedBy: adminUsername || 'system',
      orderNumber: dto.orderNumber ?? undefined,
    };
    const savedWarranty = await this.warrantyRepo.save(warranty);
    const log = this.logRepo.create({
      warrantyId: String(savedWarranty.id),
      action: 'created',
      changes: this.toJsonValue(dto),
      admin: adminUsername || 'system',
    });
    await this.logRepo.save(log);

    // After a successful creation, remove any prior skip logs (duplicate or already_active)
    // that reference the same IMEI/Serial or the same product+order to avoid confusing entries.
    try {
      const skippedLogs = await this.logRepo.find({
        where: {
          action: In([
            'create_skipped_duplicate',
            'create_skipped_already_active',
          ]),
        },
      });
      const toRemoveIds: any[] = [];
      const normalize = (v: any) => {
        if (v === null || v === undefined) return null;
        try {
          return String(v).trim().toLowerCase();
        } catch {
          return null;
        }
      };
      const savedImei = normalize((savedWarranty as any).imei);
      const savedSerial = normalize((savedWarranty as any).serial);
      const savedProduct = normalize((savedWarranty as any).productId);
      const savedOrderNo = normalize((savedWarranty as any).orderNumber);

      for (const l of skippedLogs) {
        let changes: any = (l as any).changes || {};
        // attempted may have been stringified by some callers; try to parse if it's a string
        if (changes && typeof changes.attempted === 'string') {
          try {
            changes.attempted = JSON.parse(changes.attempted);
          } catch {
            // leave as-is
          }
        }
        const attempted = changes.attempted || {};

        const attemptedImei = normalize(
          attempted.imei || attempted.IMEI || attempted.Imei,
        );
        const attemptedSerial = normalize(attempted.serial);
        const attemptedProduct = normalize(
          attempted.productId || attempted.product,
        );
        const attemptedOrderNo = normalize(
          attempted.orderNumber || attempted.orderNo || attempted.order,
        );

        // Delete if IMEI or serial match
        if (savedImei && attemptedImei && savedImei === attemptedImei) {
          toRemoveIds.push(l.id);
          continue;
        }
        if (savedSerial && attemptedSerial && savedSerial === attemptedSerial) {
          toRemoveIds.push(l.id);
          continue;
        }

        // Delete if product + orderNumber match
        if (
          savedProduct &&
          attemptedProduct &&
          savedProduct === attemptedProduct &&
          savedOrderNo &&
          attemptedOrderNo &&
          savedOrderNo === attemptedOrderNo
        ) {
          toRemoveIds.push(l.id);
          continue;
        }
      }

      // perform deletes
      let deleted = 0;
      for (const id of toRemoveIds) {
        try {
          await this.logRepo.delete({ id: String(id) });
          deleted++;
        } catch (e) {
          // ignore deletion failures for individual logs
        }
      }
      if (deleted > 0) {
        console.log(
          `[Warranty] cleaned up ${deleted} prior skip logs for warranty ${String((savedWarranty as any).id)}`,
        );
      }
    } catch (e) {
      // Non-fatal: if we cannot cleanup logs, creation still succeeded.
    }

    return {
      ...savedWarranty,
      id: savedWarranty.id ? String(savedWarranty.id) : undefined,
    };
  }

  async deleteLog(id: string, adminUsername?: string) {
    const found = await this.logRepo.findOne({ where: { id } });

    if (!found) {
      throw new NotFoundException('Log not found');
    }

    await this.logRepo.delete({ id });
    return { success: true };
  }

  async lookup(dto: WarrantyLookupDto) {
    let warranty: WarrantyRecord | undefined;
    if (dto.imei) {
      warranty =
        (await this.warrantyRepo.findOne({
          where: { imei: dto.imei, phone: dto.phone },
        })) || undefined;
    } else if (dto.serial) {
      warranty =
        (await this.warrantyRepo.findOne({
          where: { serial: dto.serial, phone: dto.phone },
        })) ?? undefined;
    }
    if (!warranty) {
      throw new NotFoundException(
        `No matching warranty found for ${dto.imei ? `IMEI: ${dto.imei}` : `Serial: ${dto.serial}`} and Phone: ${dto.phone}`,
      );
    }
    return await this.buildWarrantyDetail(warranty);
  }

  async update(
    id: string,
    dto: Partial<ActivateWarrantyDto>,
    adminUsername?: string,
  ) {
    const warranty = await this.warrantyRepo.findOne({ where: { id } });
    if (!warranty) throw new NotFoundException('Warranty not found');
    Object.assign(warranty, dto);
    const saved = await this.warrantyRepo.save(warranty);
    const log = this.logRepo.create({
      warrantyId: saved.id ? String(saved.id) : undefined,
      action: 'updated',
      changes: this.toJsonValue(dto),
      admin: adminUsername || 'system',
    });
    await this.logRepo.save(log);
    return { ...saved, id: saved.id ? String(saved.id) : undefined };
  }

  async delete(id: string, adminUsername?: string) {
    const warranty = await this.warrantyRepo.findOne({ where: { id } });
    if (!warranty) throw new NotFoundException('Warranty not found');
    await this.warrantyRepo.delete({ id });
    const log = this.logRepo.create({
      warrantyId: warranty.id ? String(warranty.id) : undefined,
      action: 'deleted',
      changes: this.toJsonValue(warranty),
      admin: adminUsername || 'system',
    });
    await this.logRepo.save(log);
    return { success: true };
  }

  async getLogs(id: string) {
    const logs = await this.logRepo.find({
      where: { warrantyId: id },
    });
    return logs;
  }

  async findAll(options?: { page?: number; limit?: number }) {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 100;
    const [warranties, total] = await this.warrantyRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data: warranties.map((w) => ({
        ...w,
        id: w.id ? String(w.id) : undefined,
      })),
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
    };
  }

  async findByOrderNumber(orderNumber: string) {
    const warranties = await this.warrantyRepo.find({
      where: { orderNumber },
      order: { createdAt: 'DESC' },
    });
    if (!warranties.length) {
      throw new NotFoundException(`No warranties found for order ${orderNumber}`);
    }
    const detailed = await Promise.all(
      warranties.map((w) => this.buildWarrantyDetail(w)),
    );
    return {
      orderNumber,
      total: detailed.length,
      warranties: detailed,
    };
  }

  private async buildWarrantyDetail(warranty: WarrantyRecord) {
    const warrantyId = warranty.id ? String(warranty.id) : undefined;
    const logs = warrantyId
      ? await this.logRepo.find({
          where: { warrantyId },
          order: { createdAt: 'DESC' },
        })
      : [];
    return {
      ...warranty,
      id: warrantyId,
      startDate: warranty.purchaseDate,
      endDate: warranty.expiryDate,
      remainingDays: this.calculateRemainingDays(warranty.expiryDate),
      logs,
    };
  }

  private calculateRemainingDays(expiryDate?: Date | string | null) {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.max(
      0,
      Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }
}
