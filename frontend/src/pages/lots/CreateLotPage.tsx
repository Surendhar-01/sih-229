import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Layers,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Save,
  HelpCircle,
  AlertCircle,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ImageUploader } from '../../components/lots/ImageUploader';
import { AIAnalysisCard } from '../../components/lots/AIAnalysisCard';
import { CategorySelectorModal } from '../../components/lots/CategorySelectorModal';
import { ConditionSelector } from '../../components/lots/ConditionSelector';
import { WeightQuantityInput } from '../../components/lots/WeightQuantityInput';
import { LocationPicker } from '../../components/lots/LocationPicker';
import { PriceEstimateCard } from '../../components/lots/PriceEstimateCard';
import { LotReview } from '../../components/lots/LotReview';
import { CompressedImage } from '../../utils/imageCompressor';
import { offlineStorage } from '../../utils/offlineStorage';
import {
  lotsService,
  MaterialCategory,
  MaterialSubcategory,
  AiClassificationResult,
} from '../../services/lotsService';
import { useAuthStore } from '../../store/authStore';

export const CreateLotPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isCollectorIntake = user?.role === 'COLLECTION_COLLECTOR';
  const lotsHomeRoute = isCollectorIntake ? '/collector/intake/lots' : '/user/lots';

  // Wizard Step (1: Photos & AI, 2: Condition & Weight, 3: Location & Price, 4: Review)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | undefined>(undefined);
  const [selectedSubcategory, setSelectedSubcategory] = useState<MaterialSubcategory | undefined>(undefined);
  const [userConfirmedCategory, setUserConfirmedCategory] = useState<string>('');

  const [condition, setCondition] = useState<string>('WORKING');
  const [quantity, setQuantity] = useState<number>(1);
  const [weight, setWeight] = useState<number>(2.0);
  const [unit, setUnit] = useState<string>('kg');
  const [description, setDescription] = useState<string>('');

  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('Mumbai');
  const [district, setDistrict] = useState<string>('Mumbai Suburban');
  const [state, setState] = useState<string>('Maharashtra');
  const [pincode, setPincode] = useState<string>('400001');
  const [latitude, setLatitude] = useState<number>(19.0760);
  const [longitude, setLongitude] = useState<number>(72.8777);

  // AI Analysis State
  const [analyzingAi, setAnalyzingAi] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AiClassificationResult | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  // Valuation State
  const [minValue, setMinValue] = useState<number>(350);
  const [maxValue, setMaxValue] = useState<number>(650);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [submitSuccessCode, setSubmitSuccessCode] = useState<string | null>(null);

  // Load database-driven material categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const catList = await lotsService.getCategories();
        setCategories(catList);
        if (catList.length > 0 && !selectedCategory) {
          setSelectedCategory(catList[0]);
          if (catList[0].subcategories && catList[0].subcategories.length > 0) {
            setSelectedSubcategory(catList[0].subcategories[0]);
            setUserConfirmedCategory(catList[0].subcategories[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, []);

  // Trigger AI Scan when user uploads their first image
  useEffect(() => {
    if (images.length > 0 && !aiResult && !analyzingAi) {
      triggerAiScan(images[0]);
    }
  }, [images]);

  const triggerAiScan = async (primaryImg: CompressedImage) => {
    setAnalyzingAi(true);
    setFeedbackError(null);
    try {
      const scanResult = await lotsService.scanWithAi({
        image_base64: primaryImg.dataUrl,
        user_hints: primaryImg.originalName,
      });

      setAiResult(scanResult);

      // Auto-match category if possible
      const matchedCat = categories.find(
        (c) =>
          c.code.toLowerCase() === scanResult.material_category.toLowerCase() ||
          c.name.toLowerCase().includes(scanResult.material_category.toLowerCase().replace(/_/g, ' '))
      );

      if (matchedCat) {
        setSelectedCategory(matchedCat);
        if (matchedCat.subcategories && matchedCat.subcategories.length > 0) {
          setSelectedSubcategory(matchedCat.subcategories[0]);
          setUserConfirmedCategory(matchedCat.subcategories[0].name);
        } else {
          setUserConfirmedCategory(matchedCat.name);
        }
      }

      if (scanResult.estimated_value_range) {
        setMinValue(scanResult.estimated_value_range.min_inr);
        setMaxValue(scanResult.estimated_value_range.max_inr);
      }
    } catch (err: any) {
      console.warn('AI Scan non-fatal failure:', err);
    } finally {
      setAnalyzingAi(false);
    }
  };

  // Recalculate price valuation when category, condition, or weight changes
  useEffect(() => {
    let baseMin = 200;
    let baseMax = 450;

    if (selectedSubcategory?.base_price_per_kg) {
      baseMin = Math.round(selectedSubcategory.base_price_per_kg * weight * 0.85);
      baseMax = Math.round(selectedSubcategory.base_price_per_kg * weight * 1.25);
    } else if (selectedCategory?.id === 10) {
      // Laptops / Phones
      baseMin = 800;
      baseMax = 1600;
    } else if (selectedCategory?.id === 20) {
      // Appliances
      baseMin = 1200;
      baseMax = 2200;
    }

    // Apply condition multiplier
    let multiplier = 1.0;
    switch (condition) {
      case 'WORKING':
        multiplier = 1.4;
        break;
      case 'PARTIALLY_WORKING':
        multiplier = 1.0;
        break;
      case 'NOT_WORKING':
        multiplier = 0.8;
        break;
      case 'DAMAGED':
        multiplier = 0.65;
        break;
      case 'SCRAP_BROKEN':
        multiplier = 0.45;
        break;
      default:
        multiplier = 0.7;
    }

    setMinValue(Math.round(baseMin * multiplier * quantity));
    setMaxValue(Math.round(baseMax * multiplier * quantity));
  }, [selectedCategory, selectedSubcategory, condition, weight, quantity]);

  const handleCategorySelect = (category: MaterialCategory, subcategory?: MaterialSubcategory) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setUserConfirmedCategory(subcategory?.name || category.name);
    setIsCategoryModalOpen(false);
  };

  const handleSaveDraft = () => {
    const draft = offlineStorage.saveDraft({
      category_id: selectedCategory?.id || 10,
      category_name: selectedCategory?.name,
      material_id: selectedSubcategory?.id,
      material_name: selectedSubcategory?.name,
      condition,
      quantity,
      estimated_weight_kg: weight,
      weight_unit: unit,
      pickup_address: address,
      city,
      district,
      state,
      pickup_pincode: pincode,
      latitude,
      longitude,
      ai_category: aiResult?.material_category,
      ai_subcategory: aiResult?.subcategory,
      ai_confidence: aiResult?.confidence,
      user_confirmed_category: userConfirmedCategory,
      estimated_min_value: minValue,
      estimated_max_value: maxValue,
      estimated_value: (minValue + maxValue) / 2,
      images: images.map((img, i) => ({
        image_url: img.dataUrl,
        original_filename: img.originalName,
        file_size: img.fileSize,
        mime_type: img.mimeType,
        is_primary: i === 0,
      })),
    });

    alert(`Draft saved locally (${draft.id}). You can complete or sync it anytime.`);
  };

  const handleSubmitLot = async () => {
    if (!address.trim() || !pincode.trim()) {
      setFeedbackError('Please provide a complete pickup address and PIN code.');
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    setFeedbackError(null);

    try {
      const payload = {
        category_id: selectedCategory?.id || 10,
        category_name: selectedCategory?.name,
        material_id: selectedSubcategory?.id,
        material_name: selectedSubcategory?.name || userConfirmedCategory,
        description: description || `${userConfirmedCategory} (${condition})`,
        condition,
        quantity,
        estimated_weight_kg: weight,
        weight_unit: unit,
        pickup_address: address,
        city,
        district,
        state,
        pickup_pincode: pincode,
        latitude,
        longitude,
        ai_category: aiResult?.material_category,
        ai_subcategory: aiResult?.subcategory,
        ai_confidence: aiResult?.confidence,
        user_confirmed_category: userConfirmedCategory,
        estimated_min_value: minValue,
        estimated_max_value: maxValue,
        estimated_value: (minValue + maxValue) / 2,
        valuation_currency: 'INR',
        images: images.map((img, i) => ({
          image_url: img.dataUrl,
          original_filename: img.originalName,
          file_size: img.fileSize,
          mime_type: img.mimeType,
          is_primary: i === 0,
        })),
      };

      const created = await lotsService.createLot(payload);
      setSubmitSuccessCode(created.lot_code);
    } catch (err: any) {
      console.warn('Direct submission error, saving as offline pending draft:', err);
      // Fallback offline draft queue
      handleSaveDraft();
      setFeedbackError(
        'Network error or backend unreachable. Your lot has been safely preserved locally in your offline drafts and will synchronize once reconnected.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: t('lot.stepPhotos'), icon: <Camera className="w-4 h-4" /> },
    { num: 2, label: t('lot.stepCategory'), icon: <Layers className="w-4 h-4" /> },
    { num: 3, label: t('lot.stepLocation'), icon: <MapPin className="w-4 h-4" /> },
    { num: 4, label: t('lot.stepReview'), icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  // Success Screen After Submission
  if (submitSuccessCode) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">{t('lot.submitSuccess')}</h2>
          <p className="text-slate-400 text-sm mt-1">
            Your e-waste lot has been registered on the national ledger with status{' '}
            <span className="text-blue-400 font-semibold">WAITING_FOR_QUOTE</span>.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 max-w-md mx-auto space-y-3">
          <div>
            <span className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
              {t('lot.lotCode')}
            </span>
            <div className="text-2xl font-mono font-extrabold text-emerald-400 tracking-wider">
              {submitSuccessCode}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 flex justify-between text-xs text-slate-400">
            <span>Estimated Payout:</span>
            <span className="font-bold text-white">₹{minValue} &ndash; ₹{maxValue}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(lotsHomeRoute)}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg transition"
          >
            {t('lot.viewMyLots')}
          </button>

          <button
            type="button"
            onClick={() => {
              setSubmitSuccessCode(null);
              setImages([]);
              setAiResult(null);
              setCurrentStep(1);
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold border border-slate-700 transition"
          >
            Create Another Lot
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-lot-page max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="lot-page-header">
        <div>
          <div className="lot-eyebrow"><Sparkles className="w-3.5 h-3.5" /> {isCollectorIntake ? 'FIELD INTAKE & AI INSPECTION' : 'AI E-WASTE INSPECTION WORKSPACE'}</div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{isCollectorIntake ? 'Register e-waste intake' : t('lot.createTitle')}</h1>
          <p className="text-slate-400 text-sm mt-1">{isCollectorIntake ? 'Capture customer e-waste, run the AI inspection, record weight and create a tracked collection lot.' : 'Sell or responsibly recycle your electronics with AI-powered valuation and verified collection.'}</p>
        </div>
        <div className="lot-trust-note"><ShieldCheck className="w-4 h-4" /> Secure photo processing</div>
      </div>

      {/* Step Stepper Header */}
      <div className="lot-progress-summary"><span>STEP {currentStep} OF 4</span><strong>{Math.round((currentStep / 4) * 100)}% Complete</strong></div>
      <div className="grid grid-cols-4 gap-2 border-b border-slate-800 pb-4 lot-stepper">
        {stepsList.map((st) => {
          const isCurrent = currentStep === st.num;
          const isPassed = currentStep > st.num;

          return (
            <button
              key={st.num}
              type="button"
              onClick={() => {
                // Only allow going back or clicking current
                if (st.num < currentStep) setCurrentStep(st.num);
              }}
              className={`flex items-center gap-2 p-2 rounded-xl text-left transition ${
                isCurrent
                  ? 'bg-emerald-600/10 border border-emerald-500/40 text-emerald-300 font-bold'
                  : isPassed
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCurrent
                    ? 'bg-emerald-500 text-white'
                    : isPassed
                    ? 'bg-slate-700 text-slate-200'
                    : 'bg-slate-800 text-slate-600'
                }`}
              >
                {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : st.num}
              </div>
              <span className="hidden sm:inline text-xs truncate">{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error Alert */}
      {feedbackError && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{feedbackError}</span>
        </div>
      )}

      {/* STEP 1: Photos & AI Classification */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              Step 1: Upload Device Photos & Run Instant AI Analysis
            </h3>
            <p className="text-xs text-slate-400">
              Take or upload up to 5 clear photos of your e-waste item. Our AI will automatically
              classify device components, estimate weight, and verify safety.
            </p>
          </div>

          <div className="lot-inspection-grid">
            <section className="lot-upload-card">
              <div className="lot-card-heading"><div><h3>Scan your e-waste</h3><p>Upload clear photos from multiple angles.</p></div><div className="lot-photo-count">{images.length}/5</div></div>
              <ImageUploader images={images} onImagesChange={setImages} />
            </section>

            <section className="lot-ai-ready-card">
              <div className="lot-card-heading"><div><h3><Sparkles className="inline-icon" /> AI inspection</h3><p>Material, components and value analysis.</p></div><span className="lot-ready-pill">{analyzingAi ? 'SCANNING' : aiResult ? 'ANALYSIS READY' : 'READY'}</span></div>
              {!aiResult && !analyzingAi && <div className="lot-ai-empty"><Sparkles className="w-7 h-7" /><strong>Upload a photo to begin</strong><span>Our AI will identify materials and estimate recoverable value.</span></div>}
              {analyzingAi && <div className="lot-ai-empty"><Loader2 className="w-7 h-7 animate-spin" /><strong>Analyzing your e-waste...</strong><span>Detecting device, materials and indicative value.</span></div>}
            </section>
          </div>

          {/* AI Analysis Display */}
          <AIAnalysisCard
            aiResult={aiResult}
            analyzing={analyzingAi}
            userConfirmedCategory={userConfirmedCategory}
            onConfirmCategory={() => setCurrentStep(2)}
            onChangeCategory={() => setIsCategoryModalOpen(true)}
          />

          {/* If user has uploaded photos and wants to proceed or pick category manually */}
          {images.length > 0 && !analyzingAi && !aiResult && (
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
              >
                {t('lot.manualCategorySelect')}
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition"
              >
                <span>Continue to Condition & Weight</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Condition & Weight / Quantity */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Confirmed Category Badge & Change Option */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 text-xs">Selected Category:</span>
              <span className="font-bold text-emerald-400">{userConfirmedCategory}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 border border-slate-700 transition"
            >
              Change Category
            </button>
          </div>

          {/* Condition Selector */}
          <ConditionSelector value={condition} onChange={setCondition} />

          {/* Weight & Quantity */}
          <WeightQuantityInput
            quantity={quantity}
            onQuantityChange={setQuantity}
            weight={weight}
            onWeightChange={setWeight}
            unit={unit}
            onUnitChange={setUnit}
          />

          {/* Additional Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Additional Notes / Model Details (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dell Latitude 3490 with original charger, battery degraded, powers on."
              className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md transition"
            >
              <span>Next: Location & Valuation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Location & Indicative Price Estimate */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <LocationPicker
            address={address}
            onAddressChange={setAddress}
            city={city}
            onCityChange={setCity}
            district={district}
            onDistrictChange={setDistrict}
            state={state}
            onStateChange={setState}
            pincode={pincode}
            onPincodeChange={setPincode}
            latitude={latitude}
            longitude={longitude}
            onCoordsChange={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
          />

          {/* Price Estimate Display */}
          <PriceEstimateCard
            minValue={minValue}
            maxValue={maxValue}
            categoryName={userConfirmedCategory}
            condition={condition}
          />

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              type="button"
              onClick={() => {
                if (!address.trim()) {
                  setFeedbackError('Please enter a street address for collection.');
                  return;
                }
                setFeedbackError(null);
                setCurrentStep(4);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md transition"
            >
              <span>Review & Submit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Pre-submission Review */}
      {currentStep === 4 && (
        <LotReview
          images={images}
          category={selectedCategory}
          subcategory={selectedSubcategory}
          condition={condition}
          quantity={quantity}
          weight={weight}
          unit={unit}
          address={address}
          city={city}
          district={district}
          state={state}
          pincode={pincode}
          latitude={latitude}
          longitude={longitude}
          minValue={minValue}
          maxValue={maxValue}
          isHazardous={selectedCategory?.is_hazardous || false}
          onBack={() => setCurrentStep(3)}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmitLot}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Hierarchical Category Selector Modal */}
      <CategorySelectorModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        selectedCategoryId={selectedCategory?.id}
        selectedMaterialId={selectedSubcategory?.id}
        onSelect={handleCategorySelect}
      />
    </div>
  );
};
