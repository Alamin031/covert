
import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { HomecategoryService } from './homecategory.service';
import { CreateHomeCategoryDto, UpdateHomeCategoryDto } from './dto/homecategory.dto';

@Controller('homecategory')
export class HomecategoryController {
    constructor(private readonly homecategoryService: HomecategoryService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.CREATE_HOME_CATEGORY)
    async create(@Body() body: CreateHomeCategoryDto) {
        const homeCategory = await this.homecategoryService.create({
            name: body.name,
            priority: body.priority,
            categoryIds: body.categoryIds,
            productIds: body.productIds,
        });
        return { ...homeCategory, id: homeCategory.id?.toString?.() ?? String(homeCategory.id) };
    }

    @Get()
    async findAll() {
        const all = await this.homecategoryService.findAll();
        return all.map(hc => ({ ...hc, id: hc.id?.toString?.() ?? String(hc.id) }));
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const hc = await this.homecategoryService.findOne(id);
        return { ...hc, id: hc.id?.toString?.() ?? String(hc.id) };
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.UPDATE_HOME_CATEGORY)
    async update(
        @Param('id') id: string,
        @Body() body: UpdateHomeCategoryDto
    ) {
        const homeCategory = await this.homecategoryService.update(id, {
            name: body.name,
            priority: body.priority,
            categoryIds: body.categoryIds,
            productIds: body.productIds,
        });
        return { ...homeCategory, id: homeCategory.id?.toString?.() ?? String(homeCategory.id) };
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.DELETE_HOME_CATEGORY)
    async remove(@Param('id') id: string) {
        return await this.homecategoryService.remove(id);
    }
}
