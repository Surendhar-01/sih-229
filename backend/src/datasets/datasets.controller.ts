import { Controller, Get, Param, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DatasetsService, DatasetType } from './datasets.service';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('Datasets & Compliance')
@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Summary overview of all 7 structured datasets required by SIH' })
  async getSummary() {
    const materials = await this.datasetsService.getMaterialDataset();
    const prices = await this.datasetsService.getPriceDataset();
    const recyclers = await this.datasetsService.getRecyclerDataset();
    const transactions = await this.datasetsService.getTransactionDataset();
    const traceability = await this.datasetsService.getTraceabilityDataset();
    const collectors = await this.datasetsService.getCollectorDataset();
    const aiMetadata = await this.datasetsService.getAiTrainingDataset();

    return {
      status: 'SUCCESS',
      total_datasets: 7,
      datasets: {
        material: { count: materials.length, name: 'Material Dataset', description: 'Categories, weights, recoverable and hazardous elements' },
        price: { count: prices.length, name: 'Price Dataset', description: 'Prevailing buying/quoted rates, units, MSP floor, 7d trends' },
        recycler: { count: recyclers.length, name: 'Recycler Dataset', description: 'Authorized facilities, CPCB validity, offered rates, capacity' },
        transaction: { count: transactions.length, name: 'Transaction Dataset', description: 'Lots, quoted vs final price, payment method, locations' },
        traceability: { count: traceability.length, name: 'Traceability Dataset', description: 'National Ledger Codes, Form 6 status, QR hashes, weighbridge weights' },
        collector: { count: collectors.length, name: 'Collector Dataset', description: 'Anonymized profiles, language, operational clusters, diverted weight' },
        'ai-training': { count: aiMetadata.metadata.total_annotated_samples, name: 'AI/ML Training Corpus', description: 'Annotated vision training samples, bounding boxes, accuracy metrics' },
      },
    };
  }

  @Get('pipeline-status')
  @ApiOperation({ summary: 'Data pipeline generation, validation, and cleaning status' })
  async getPipelineStatus() {
    return this.datasetsService.getPipelineStatus();
  }

  @Get('field-research')
  @ApiOperation({ summary: 'Documented field research with 2 working scrap collectors/aggregators' })
  async getFieldResearch() {
    return this.datasetsService.getFieldResearch();
  }

  @Get('unit-economics')
  @ApiOperation({ summary: 'Comparative unit-economics: Informal backyard vs platform recycling' })
  async getUnitEconomics() {
    return this.datasetsService.getUnitEconomics();
  }

  @Get('export/:type')
  @ApiOperation({ summary: 'Export structured dataset in CSV format for audit and validation' })
  @ApiParam({ name: 'type', enum: ['material', 'price', 'recycler', 'transaction', 'traceability', 'collector'] })
  async exportCsv(@Param('type') type: string, @Res() res: Response) {
    let data: any[] = [];
    switch (type.toLowerCase()) {
      case 'material':
        data = await this.datasetsService.getMaterialDataset();
        break;
      case 'price':
        data = await this.datasetsService.getPriceDataset();
        break;
      case 'recycler':
        data = await this.datasetsService.getRecyclerDataset();
        break;
      case 'transaction':
        data = await this.datasetsService.getTransactionDataset();
        break;
      case 'traceability':
        data = await this.datasetsService.getTraceabilityDataset();
        break;
      case 'collector':
        data = await this.datasetsService.getCollectorDataset();
        break;
      default:
        throw new HttpException(`Export for dataset type '${type}' not supported in CSV. Use JSON endpoint instead.`, HttpStatus.BAD_REQUEST);
    }

    const csvContent = this.datasetsService.convertToCsv(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ecobridges_${type}_dataset.csv"`);
    return res.send(csvContent);
  }

  @Get(':type')
  @ApiOperation({ summary: 'Get records for a specific structured dataset in JSON format' })
  @ApiParam({ name: 'type', enum: ['material', 'price', 'recycler', 'transaction', 'traceability', 'collector', 'ai-training'] })
  async getDataset(@Param('type') type: string) {
    switch (type.toLowerCase()) {
      case 'material':
        return { dataset: 'material', records: await this.datasetsService.getMaterialDataset() };
      case 'price':
        return { dataset: 'price', records: await this.datasetsService.getPriceDataset() };
      case 'recycler':
        return { dataset: 'recycler', records: await this.datasetsService.getRecyclerDataset() };
      case 'transaction':
        return { dataset: 'transaction', records: await this.datasetsService.getTransactionDataset() };
      case 'traceability':
        return { dataset: 'traceability', records: await this.datasetsService.getTraceabilityDataset() };
      case 'collector':
        return { dataset: 'collector', records: await this.datasetsService.getCollectorDataset() };
      case 'ai-training':
        return { dataset: 'ai-training', ...(await this.datasetsService.getAiTrainingDataset()) };
      default:
        throw new HttpException(`Dataset '${type}' not found. Valid types: material, price, recycler, transaction, traceability, collector, ai-training`, HttpStatus.NOT_FOUND);
    }
  }
}
