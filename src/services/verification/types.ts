import type { LucideIcon } from "lucide-react";
import {
  Leaf,
  Sun,
  Building2,
  Package,
  Trash2,
  Building,
  Sprout,
  Waves,
} from "lucide-react";

/**
 * All supported verification types for the VisionLedger
 * AI-powered Proof of Reality platform.
 */
export const VERIFICATION_TYPES = [
  "tree_plantation",
  "solar_installation",
  "construction_progress",
  "package_delivery",
  "waste_processing",
  "infrastructure_inspection",
  "agricultural_monitoring",
  "water_body_monitoring",
] as const;

export type VerificationType = (typeof VERIFICATION_TYPES)[number];

/** Human-readable label for each verification type. */
export const VERIFICATION_LABELS: Record<VerificationType, string> = {
  tree_plantation: "Tree Plantation",
  solar_installation: "Solar Installation",
  construction_progress: "Construction Progress",
  package_delivery: "Package Delivery",
  waste_processing: "Waste Processing",
  infrastructure_inspection: "Infrastructure Inspection",
  agricultural_monitoring: "Agricultural Monitoring",
  water_body_monitoring: "Water Body Monitoring",
};

/** Icon component for each verification type. */
export const VERIFICATION_ICONS: Record<VerificationType, LucideIcon> = {
  tree_plantation: Leaf,
  solar_installation: Sun,
  construction_progress: Building2,
  package_delivery: Package,
  waste_processing: Trash2,
  infrastructure_inspection: Building,
  agricultural_monitoring: Sprout,
  water_body_monitoring: Waves,
};

/** Instructions displayed on the Verify page per type. */
export const VERIFICATION_INSTRUCTIONS: Record<VerificationType, string> = {
  tree_plantation:
    "Upload a clear aerial or ground-level photo of the tree plantation area. Ensure trees are visible and not obstructed by shadows or overlapping foliage. Supported formats: JPG, PNG.",
  solar_installation:
    "Upload a photo of the solar panel installation. The image should clearly show the panels in their installed configuration. Aerial or wide-angle shots work best. Supported formats: JPG, PNG.",
  construction_progress:
    "Upload a photo showing the current state of construction. Include visible structures, foundations, or machinery to help the AI assess progress. Supported formats: JPG, PNG.",
  package_delivery:
    "Upload a photo of the delivered package at its drop-off location. The package and any visible address labels should be clearly shown. Supported formats: JPG, PNG.",
  waste_processing:
    "Upload a photo of the waste materials or recycling station. Ensure waste categories (plastic, metal, organic) are visible where possible. Supported formats: JPG, PNG.",
  infrastructure_inspection:
    "Upload a photo of the infrastructure asset being inspected — roads, bridges, streetlights, or buildings. Capture any visible damage or wear. Supported formats: JPG, PNG.",
  agricultural_monitoring:
    "Upload a photo of the crops or agricultural field. Ensure the image shows vegetation health clearly — green areas vs dry/damaged areas should be distinguishable. Supported formats: JPG, PNG.",
  water_body_monitoring:
    "Upload a photo of the water body — lake, river, reservoir, or coastline. The image should show water coverage and any visible pollution indicators. Supported formats: JPG, PNG.",
};

/**
 * Metric definitions per verification type.
 * Each metric has a key, label, unit, and whether it's a primary metric.
 */
export interface MetricDef {
  key: string;
  label: string;
  unit?: string;
  primary?: boolean;
}

export const VERIFICATION_METRICS: Record<VerificationType, MetricDef[]> = {
  tree_plantation: [
    { key: "treeCount", label: "Trees Detected", primary: true },
    { key: "vegetationCoverage", label: "Vegetation Coverage", unit: "%" },
  ],
  solar_installation: [
    { key: "panelCount", label: "Panels Detected", primary: true },
    { key: "installationCoverage", label: "Coverage", unit: "%" },
    { key: "estimatedEnergy", label: "Est. Energy Potential", unit: " kW" },
  ],
  construction_progress: [
    { key: "completionPercent", label: "Completion", unit: "%", primary: true },
    { key: "structuresDetected", label: "Structures Detected" },
  ],
  package_delivery: [
    { key: "packageDetected", label: "Package Detected", primary: true },
    { key: "addressVisible", label: "Address Visible" },
    { key: "deliveryConfidence", label: "Delivery Confidence", unit: "%" },
  ],
  waste_processing: [
    { key: "wasteCategory", label: "Waste Category", primary: true },
    { key: "estimatedVolume", label: "Est. Volume", unit: " m³" },
    { key: "processingStatus", label: "Processing Status" },
  ],
  infrastructure_inspection: [
    { key: "damageDetected", label: "Damage Detected", primary: true },
    { key: "cracksCount", label: "Cracks" },
    { key: "missingComponents", label: "Missing Components" },
    { key: "maintenanceRequired", label: "Maintenance Required" },
  ],
  agricultural_monitoring: [
    { key: "healthyCropPercent", label: "Healthy Crops", unit: "%", primary: true },
    { key: "damagedCropPercent", label: "Damaged Crops", unit: "%" },
    { key: "vegetationDensity", label: "Vegetation Density", unit: "%" },
  ],
  water_body_monitoring: [
    { key: "waterCoverage", label: "Water Coverage", unit: "%", primary: true },
    { key: "pollutionIndicators", label: "Pollution Indicators" },
    { key: "confidenceScore", label: "Confidence", unit: "%" },
  ],
};

/** Construction stage labels. */
export const CONSTRUCTION_STAGES = [
  "Foundation",
  "Structural Frame",
  "Roof Completed",
  "Near Completion",
] as const;

/** Waste category labels. */
export const WASTE_CATEGORIES = [
  "Mixed Recyclable",
  "Plastic",
  "Metal",
  "Organic",
  "Electronic",
  "Hazardous",
] as const;

/**
 * Structured metrics returned by the verification engine.
 */
export interface VerificationMetrics {
  /** Primary count or percentage value. */
  primaryValue: number;
  /** Primary label for display. */
  primaryLabel: string;
  /** All metrics as key-value pairs. */
  values: Record<string, number | string>;
  /** AI explanation text. */
  explanation: string;
  /** Verification status. */
  status: "verified" | "inconclusive" | "rejected";
  /** AI confidence score (0-100). */
  confidenceScore: number;
}

/** Combined result from the verification engine. */
export interface GenericVerificationResult {
  tree_count: number; // kept for backwards compatibility
  confidence_score: number;
  explanation: string;
  raw_response: string;
  verificationType: VerificationType;
  metrics: VerificationMetrics;
}

/** Claim type label resolver. */
export function getClaimTypeLabel(type: string): string {
  return VERIFICATION_LABELS[type as VerificationType] ?? type.replace(/_/g, " ");
}

/** Check if a string is a valid verification type. */
export function isValidVerificationType(type: string): type is VerificationType {
  return VERIFICATION_TYPES.includes(type as VerificationType);
}