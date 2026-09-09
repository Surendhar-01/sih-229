import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.service';

@Injectable()
export class MaterialsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getCategories() {
    if (!this.supabaseService.isConfigured()) {
      return [
        {
          id: 10,
          code: 'CONSUMER_ELECTRONICS',
          name: 'Consumer Electronics & Computing',
          display_names: {
            en: 'Consumer Electronics & Computing',
            hi: 'उपभोक्ता इलेक्ट्रॉनिक्स और कंप्यूटिंग',
            mr: 'ग्राहक इलेक्ट्रॉनिक्स आणि संगणक',
          },
          is_hazardous: false,
          icon_name: 'Laptop',
          description: 'Laptops, mobile phones, tablets, and desktop computers',
          subcategories: [
            { id: 101, code: 'SMARTPHONE', name: 'Mobile Phone / Smartphone', display_names: { en: 'Mobile Phone / Smartphone', hi: 'स्मार्टफोन / मोबाइल', mr: 'मोबाईल फोन' } },
            { id: 102, code: 'LAPTOP_COMPUTER', name: 'Laptop Computer', display_names: { en: 'Laptop Computer', hi: 'लैपटॉप कंप्यूटर', mr: 'लॅपटॉप संगणक' } },
            { id: 103, code: 'DESKTOP_CPU_TOWER', name: 'Desktop CPU Tower', display_names: { en: 'Desktop CPU Tower', hi: 'डेस्कटॉप कंप्यूटर', mr: 'डेस्कटॉप कॉम्प्युटर' } },
            { id: 104, code: 'TABLET_IPAD', name: 'Tablet / iPad', display_names: { en: 'Tablet / iPad', hi: 'टैबलेट / आईपैड', mr: 'टॅबलेट / आयपॅड' } },
            { id: 105, code: 'PRINTER_SCANNER', name: 'Printer / Scanner', display_names: { en: 'Printer / Scanner', hi: 'प्रिंटर / स्कैनर', mr: 'प्रिंटर / स्कॅनर' } },
          ],
        },
        {
          id: 20,
          code: 'LARGE_APPLIANCES',
          name: 'Large White Goods & Appliances',
          display_names: {
            en: 'Large White Goods & Appliances',
            hi: 'बड़े घरेलू उपकरण (फ्रिज, एसी, वाशिंग मशीन)',
            mr: 'मोठी घरगुती उपकरणे (फ्रिज, वॉशिंग मशीन)',
          },
          is_hazardous: true,
          icon_name: 'Refrigerator',
          description: 'Refrigerators, washing machines, air conditioners',
          subcategories: [
            { id: 201, code: 'REFRIGERATOR_SINGLE_DOOR', name: 'Refrigerator', display_names: { en: 'Refrigerator', hi: 'रेफ्रिजरेटर / फ्रिज', mr: 'फ्रिज / रेफ्रिजरेटर' } },
            { id: 202, code: 'WASHING_MACHINE', name: 'Washing Machine', display_names: { en: 'Washing Machine', hi: 'वाशिंग मशीन', mr: 'वॉशिंग मशीन' } },
            { id: 203, code: 'AIR_CONDITIONER_SPLIT', name: 'Air Conditioner', display_names: { en: 'Air Conditioner (AC)', hi: 'एयर कंडीशनर (एसी)', mr: 'एअर कंडिशनर (एसी)' } },
          ],
        },
        {
          id: 30,
          code: 'DISPLAYS_SCREENS',
          name: 'Displays, Monitors & Televisions',
          display_names: {
            en: 'Displays, Monitors & Televisions',
            hi: 'टेलीविजन, मॉनिटर और डिस्प्ले स्क्रीन',
            mr: 'टीव्ही, मॉनिटर आणि डिस्प्ले स्क्रीन',
          },
          is_hazardous: true,
          icon_name: 'Tv',
          description: 'CRT TVs, LED/LCD monitors and flat screens',
          subcategories: [
            { id: 301, code: 'LED_LCD_TV', name: 'Flat Screen LED/LCD TV', display_names: { en: 'Flat Screen TV', hi: 'एलईडी टीवी', mr: 'फ्लॅट स्क्रीन टीव्ही' } },
            { id: 302, code: 'CRT_MONITOR_TV', name: 'CRT Monitor / Tube TV', display_names: { en: 'CRT Monitor / TV', hi: 'सीआरटी मॉनिटर / टीवी', mr: 'सीआरटी मॉनिटर / टीव्ही' } },
          ],
        },
        {
          id: 40,
          code: 'ELECTRONIC_COMPONENTS',
          name: 'Batteries, PCBs & Circuit Boards',
          display_names: {
            en: 'Batteries, PCBs & Circuit Boards',
            hi: 'बैटरी, सर्किट बोर्ड और पुर्जे',
            mr: 'बॅटरी, सर्किट बोर्ड आणि सुटे भाग',
          },
          is_hazardous: true,
          icon_name: 'Cpu',
          description: 'Lithium-ion batteries, lead-acid batteries, motherboards',
          subcategories: [
            { id: 401, code: 'LI_ION_BATTERY_PACK', name: 'Lithium-Ion Battery', display_names: { en: 'Lithium-Ion Battery', hi: 'लिथियम-आयन बैटरी', mr: 'लिथियम-आयन बॅटरी' } },
            { id: 402, code: 'LEAD_ACID_UPS_BATTERY', name: 'Lead-Acid Inverter Battery', display_names: { en: 'Inverter / UPS Battery', hi: 'इन्वर्टर बैटरी', mr: 'इन्व्हर्टर बॅटरी' } },
            { id: 403, code: 'HIGH_GRADE_PCB', name: 'Motherboard / High-Grade PCB', display_names: { en: 'Motherboard PCB', hi: 'मदरबोर्ड सर्किट बोर्ड', mr: 'मदरबोर्ड' } },
          ],
        },
        {
          id: 50,
          code: 'PERIPHERALS_CABLES',
          name: 'Cables, Chargers & Small Accessories',
          display_names: {
            en: 'Cables, Chargers & Small Accessories',
            hi: 'केबल, चार्जर और सहायक उपकरण',
            mr: 'केबल्स, चार्जर आणि अ‍ॅक्सेसरीज',
          },
          is_hazardous: false,
          icon_name: 'Cable',
          description: 'Copper cables, wiring harnesses, chargers, adapters',
          subcategories: [
            { id: 501, code: 'COPPER_CABLES_WIRES', name: 'Copper Wiring & Cables', display_names: { en: 'Copper Cables', hi: 'तांबे के तार', mr: 'तांब्याच्या तारा' } },
            { id: 502, code: 'CHARGERS_ADAPTERS', name: 'Chargers & Power Adapters', display_names: { en: 'Charger / Adapter', hi: 'चार्जर / अडैप्टर', mr: 'चार्जर / अ‍ॅडॉप्टर' } },
          ],
        },
      ];
    }
    const { data } = await this.supabaseService.getClient().from('material_categories').select('*, subcategories:materials(*)');
    return data || [];
  }

  async getMaterials() {
    if (!this.supabaseService.isConfigured()) {
      return [
        { id: 101, category_id: 10, code: 'SMARTPHONE', name: 'Mobile Phone / Smartphone', hazardous: false, base_price_per_kg: 350, unit: 'unit' },
        { id: 102, category_id: 10, code: 'LAPTOP_COMPUTER', name: 'Laptop Computer', hazardous: false, base_price_per_kg: 1400, unit: 'unit' },
        { id: 103, category_id: 10, code: 'DESKTOP_CPU_TOWER', name: 'Desktop Computer Tower', hazardous: false, base_price_per_kg: 950, unit: 'unit' },
        { id: 201, category_id: 20, code: 'REFRIGERATOR_SINGLE_DOOR', name: 'Refrigerator', hazardous: true, base_price_per_kg: 1800, unit: 'unit' },
        { id: 301, category_id: 30, code: 'LED_LCD_TV', name: 'Flat Screen LED/LCD TV', hazardous: false, base_price_per_kg: 850, unit: 'unit' },
        { id: 401, category_id: 40, code: 'LI_ION_BATTERY_PACK', name: 'Lithium-Ion Battery', hazardous: true, base_price_per_kg: 85, unit: 'kg' },
        { id: 403, category_id: 40, code: 'HIGH_GRADE_PCB', name: 'Motherboard / High-Grade PCB', hazardous: false, base_price_per_kg: 420, unit: 'kg' },
        { id: 501, category_id: 50, code: 'COPPER_CABLES_WIRES', name: 'Copper Wiring & Cables', hazardous: false, base_price_per_kg: 320, unit: 'kg' },
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
