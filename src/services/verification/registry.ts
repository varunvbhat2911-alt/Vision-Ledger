import type {
  VerificationType,
  VerificationMetrics,
  GenericVerificationResult,
} from "./types";
import {
  CONSTRUCTION_STAGES,
  WASTE_CATEGORIES,
  VERIFICATION_LABELS,
  VERIFICATION_METRICS,
} from "./types";

/**
 * Mock data generator for each verification type.
 * Returns realistic, randomized outputs for development and testing.
 */

interface MockGenerator {
  generate(): {
    metrics: VerificationMetrics;
    raw: string;
  };
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 1): number {
  const val = Math.random() * (max - min) + min;
  return Math.round(val * 10 ** decimals) / 10 ** decimals;
}

function delay(): Promise<void> {
  return new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));
}

// ── Tree Plantation ──

const treeGenerator: MockGenerator = {
  generate() {
    const treeCount = rand(15, 95);
    const vegetationCoverage = rand(40, 98);
    const confidence = rand(70, 95);

    return {
      metrics: {
        primaryValue: treeCount,
        primaryLabel: "Trees Detected",
        values: {
          treeCount,
          vegetationCoverage,
        },
        explanation: `Mock analysis detected approximately ${treeCount} individual trees with ${vegetationCoverage}% vegetation coverage. Confidence is ${confidence}%. This is a simulated result — connect a Vision AI model for real analysis.`,
        status: confidence >= 70 ? "verified" : "inconclusive",
        confidenceScore: confidence,
      },
      raw: JSON.stringify({ tree_count: treeCount, vegetation_coverage: vegetationCoverage, confidence_score: confidence }),
    };
  },
};

// ── Solar Installation ──

const solarGenerator: MockGenerator = {
  generate() {
    const panelCount = rand(20, 120);
    const coverage = rand(50, 98);
    const energy = randFloat(15, 200);
    const confidence = rand(70, 95);

    return {
      metrics: {
        primaryValue: panelCount,
        primaryLabel: "Panels Detected",
        values: { panelCount, installationCoverage: coverage, estimatedEnergy: energy },
        explanation: `The uploaded image contains approximately ${panelCount} photovoltaic panels arranged in operational rows, covering ${coverage}% of the installation area. Estimated energy potential is ${energy} kW. Confidence: ${confidence}%.`,
        status: confidence >= 70 ? "verified" : "inconclusive",
        confidenceScore: confidence,
      },
      raw: JSON.stringify({ panel_count: panelCount, coverage, energy_potential_kw: energy, confidence_score: confidence }),
    };
  },
};

// ── Construction Progress ──

const constructionGenerator: MockGenerator = {
  generate() {
    const completionPercent = rand(10, 95);
    const structuresDetected = rand(1, 8);
    const confidence = rand(70, 95);
    const stageIdx = Math.min(
      Math.floor(completionPercent / 25),
      CONSTRUCTION_STAGES.length - 1,
    );
    const stage = CONSTRUCTION_STAGES[stageIdx];

    return {
      metrics: {
        primaryValue: completionPercent,
        primaryLabel: "Completion",
        values: {
          completionPercent,
          structuresDetected,
          stage,
        },
        explanation: `The uploaded image shows ${structuresDetected} detectable structures. The construction appears to be at the "${stage}" stage with approximately ${completionPercent}% completion. Confidence: ${confidence}%.`,
        status: confidence >= 70 ? "verified" : "inconclusive",
        confidenceScore: confidence,
      },
      raw: JSON.stringify({ completion_percent: completionPercent, structures: structuresDetected, stage, confidence_score: confidence }),
    };
  },
};

// ── Package Delivery ──

const packageGenerator: MockGenerator = {
  generate() {
    const packageDetected = Math.random() > 0.15;
    const addressVisible = Math.random() > 0.3;
    const deliveryConfidence = packageDetected ? rand(75, 98) : rand(20, 45);
    const confidence = rand(70, 95);

    return {
      metrics: {
        primaryValue: packageDetected ? 1 : 0,
        primaryLabel: "Package Detected",
        values: {
          packageDetected: packageDetected ? "Yes" : "No",
          addressVisible: addressVisible ? "Yes" : "Partially",
          deliveryConfidence,
        },
        explanation: packageDetected
          ? `A delivery package is visible near the entrance. Address markings appear ${addressVisible ? "clearly readable" : "partially readable"}. Delivery confidence: ${deliveryConfidence}%.`
          : `No delivery package could be confidently identified in the submitted image. Delivery confidence: ${deliveryConfidence}%. Consider retaking the photo with better lighting.`,
        status: packageDetected && deliveryConfidence >= 70 ? "verified" : "inconclusive",
        confidenceScore: confidence,
      },
      raw: JSON.stringify({ package_detected: packageDetected, address_visible: addressVisible, delivery_confidence: deliveryConfidence, confidence_score: confidence }),
    };
  },
};

// ── Waste Processing ──

const wasteGenerator: MockGenerator = {
  generate() {
    const category = WASTE_CATEGORIES[rand(0, WASTE_CATEGORIES.length - 1)];
    const estimatedVolume = randFloat(0.5, 10);
    const processingStatuses = ["Pending", "In Progress", "Completed"];
    const processingStatus = processingStatuses[rand(0, 2)];
    const confidence = rand(70, 95);

    return {
      metrics: {
        primaryValue: estimatedVolume,
        primaryLabel: "Est. Volume",
        values: {
          wasteCategory: category,
          estimatedVolume,
          processingStatus,
        },
        explanation: `The uploaded evidence contains ${category.toLowerCase()} waste with an estimated processing volume of ${estimatedVolume} cubic meters. Processing status: ${processingStatus}. Confidence: ${confidence}%.`,
        status: confidence >= 70 ? "verified" : "inconclusive",
        confidenceScore: confidence,
      },
      raw: JSON.stringify({ waste_category: category, estimated_volume: estimatedVolume, processing_status: processingStatus, confidence_score: confidence }),
    };
  },
};

// ── Infrastructure Inspection ──

const infrastructureGenerator: MockGenerator = {
  generate() {
    const cracksCount = rand(0, 8);
    const missingComponents = rand(0, 4);
    const maintenanceRequired = cracksCount > 2 || missingComponents > 1;
    const damageDetected = cracksCount + missingComponents;
    const confidence = rand(70, 95);

    return {
      metrics: {
        primaryValue: damageDetected,
        primaryLabel: "Issues Detected",
        values: {
          damageDetected,
          cracksCount,
          missingComponents,
          maintenanceRequired: maintenanceRequired ? "Yes" : "No",
        },
        explanation: `Inspection detected ${cracksCount} crack(s) and ${missingComponents} missing component(s). Maintenance is ${maintenanceRequired ? "recommended" : "not urgently required"}. Confidence: ${confidence}%.`,
        status: maintenanceRequired ? "verified" : "verified",
        confidenceScore: confidence,
      },
      raw: JSON.stringify({ cracks: cracksCount, missing: missingComponents, maintenance: maintenanceRequired, confidence_score: confidence }),
    };
  },
};

// ── Agricultural Monitoring ──

const agricultureGenerator: MockGenerator = {
  generate() {
    const healthyCropPercent = rand(40, 98);
    const damagedCropPercent = rand(2, 60);
    const vegetationDensity = rand(30, 95);
    const confidence = rand(70, 95);

    return {
      metrics: {
        primaryValue: healthyCropPercent,
        primaryLabel: "Healthy Crops",
        values: {
          healthyCropPercent,
          damagedCropPercent,
          vegetationDensity,
        },
        explanation: `Crop analysis shows ${healthyCropPercent}% healthy vegetation and ${damagedCropPercent}% damaged or dry areas. Overall vegetation density is ${vegetationDensity}%. Confidence: ${confidence}%.`,
        status: healthyCropPercent >= 60 ? "verified" : "inconclusive",
        confidenceScore: confidence,
      },
      raw: JSON.stringify({ healthy: healthyCropPercent, damaged: damagedCropPercent, density: vegetationDensity, confidence_score: confidence }),
    };
  },
};

// ── Water Body Monitoring ──

const waterGenerator: MockGenerator = {
  generate() {
    const waterCoverage = rand(40, 100);
    const pollutionDetected = Math.random() > 0.5;
    const pollutionSeverity = pollutionDetected ? rand(1, 8) : 0;
    const confidence = rand(70, 95);

    return {
      metrics: {
        primaryValue: waterCoverage,
        primaryLabel: "Water Coverage",
        values: {
          waterCoverage,
          pollutionIndicators: pollutionDetected ? `Detected (severity: ${pollutionSeverity}/10)` : "None detected",
          confidenceScore: confidence,
        },
        explanation: pollutionDetected
          ? `Water coverage is ${waterCoverage}%. Pollution indicators detected with severity ${pollutionSeverity}/10. Further investigation recommended. Confidence: ${confidence}%.`
          : `Water coverage is ${waterCoverage}%. No significant pollution indicators detected. Confidence: ${confidence}%.`,
        status: confidence >= 70 ? "verified" : "inconclusive",
        confidenceScore: confidence,
      },
      raw: JSON.stringify({ water_coverage: waterCoverage, pollution: pollutionDetected, severity: pollutionSeverity, confidence_score: confidence }),
    };
  },
};

// ── Registry ──

const generatorMap: Record<VerificationType, MockGenerator> = {
  tree_plantation: treeGenerator,
  solar_installation: solarGenerator,
  construction_progress: constructionGenerator,
  package_delivery: packageGenerator,
  waste_processing: wasteGenerator,
  infrastructure_inspection: infrastructureGenerator,
  agricultural_monitoring: agricultureGenerator,
  water_body_monitoring: waterGenerator,
};

/**
 * Generate a mock verification result for the given type.
 */
export async function generateMockResult(
  type: VerificationType,
): Promise<GenericVerificationResult> {
  await delay();

  const generator = generatorMap[type];
  const { metrics, raw } = generator.generate();

  // tree_count is kept for backwards compatibility with the existing
  // verification_results table column. For non-tree types, it maps to
  // the primary metric value or 0.
  const treeCount =
    type === "tree_plantation"
      ? (metrics.values.treeCount as number)
      : typeof metrics.primaryValue === "number"
        ? metrics.primaryValue
        : 0;

  return {
    tree_count: treeCount,
    confidence_score: metrics.confidenceScore,
    explanation: metrics.explanation,
    raw_response: raw,
    verificationType: type,
    metrics,
  };
}

/** Get the label for a verification type. */
export function getLabel(type: VerificationType): string {
  return VERIFICATION_LABELS[type];
}

/** Get metric definitions for a verification type. */
export function getMetricDefs(type: VerificationType) {
  return VERIFICATION_METRICS[type];
}