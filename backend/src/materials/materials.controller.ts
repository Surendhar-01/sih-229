import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';

@ApiTags('Materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List all e-waste material categories' })
  async getCategories() {
    return this.materialsService.getCategories();
  }

  @Get('list')
  @ApiOperation({ summary: 'List all specific material types' })
  async getMaterials() {
    return this.materialsService.getMaterials();
  }

  @Get('safety/:categoryId')
  @ApiOperation({ summary: 'Get contextual safety directives for a category' })
  async getSafetyGuideline(@Param('categoryId') categoryId: string) {
    return this.materialsService.getSafetyGuidance(Number(categoryId));
  }
}
