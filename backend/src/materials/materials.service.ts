import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';

@Injectable()
export class MaterialsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getCategories() {
    if (!this.supabaseService.isConfigured()) {
      return [
        { id: 1, code: 'CRT_DISPLAY', name: 'Cathode Ray Tube (CRT)', is_hazardous: true, icon_name: 'Tv' },
        { id: 2, code: 'FLAT_DISPLAY', name: 'LCD / LED Flat Panel Display', is_hazardous: true, icon_name: 'Monitor' },
        { id: 3, code: 'PCB_ASSEMBLY', name: 'Printed Circuit Boards (PCB)', is_hazardous: false, icon_name: 'Cpu' },
        { id: 4, code: 'LI_BATTERY', name: 'Lithium-Ion / Lead Acid Battery', is_hazardous: true, icon_name: 'BatteryCharging' },
        { id: 5, code: 'CABLES_WIRES', name: 'Cables & Wiring Harnesses', is_hazardous: false, icon_name: 'Cable' },
        { id: 6, code: 'COOLING_APPLIANCE', name: 'Refrigerators & ACs', is_hazardous: true, icon_name: 'Wind' },
        { id: 7, code: 'MIXED_PLASTICS', name: 'Electronics Plastic Housing', is_hazardous: false, icon_name: 'Layers' },
      ];
    }
    const { data } = await this.supabaseService.getClient().from('material_categories').select('*');
    return data || [];
  }

  async getMaterials() {
    if (!this.supabaseService.isConfigured()) {
      return [
        { id: 1, category_id: 1, code: 'CRT_TV_21INCH', name: '21" CRT Color TV', hazardous: true, base_price_per_kg: 350 },
        { id: 2, category_id: 2, code: 'LCD_LAPTOP_SCREEN', name: 'Laptop LCD Panel', hazardous: false, base_price_per_kg: 180 },
        { id: 3, category_id: 3, code: 'HIGH_GRADE_MOTHERBOARD', name: 'Desktop Motherboard', hazardous: false, base_price_per_kg: 420 },
      ];
    }
    const { data } = await this.supabaseService.getClient().from('materials').select('*');
    return data || [];
  }

  async getSafetyGuidance(categoryId: number) {
    if (!this.supabaseService.isConfigured()) {
      return {
        category_id: categoryId,
        hazard_level: 'HIGH',
        title: { en: 'Hazardous Handling Instructions' },
        do_instructions: { en: ['Wear heavy gloves', 'Store in dry place'] },
        dont_instructions: { en: ['Do not crush', 'Do not burn'] },
      };
    }
    const { data } = await this.supabaseService
      .getClient()
      .from('safety_guidance')
      .select('*')
      .eq('category_id', categoryId)
      .single();

    return data;
  }
}
