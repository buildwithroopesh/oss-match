/**
 * Language Footprint Module
 *
 * Core module for aggregating repository language metrics, computing exact code share,
 * and mapping language presentation colors.
 */

export {
  aggregateLanguageFootprint,
  DEFAULT_TOP_LANGUAGES,
} from "./aggregator";

export {
  distributePercentages,
  type RoundingInput,
  type RoundedItem,
} from "./rounding";

export {
  getLanguageColor,
  attachLanguageColors,
  LANGUAGE_COLORS,
  DEFAULT_LANGUAGE_COLOR,
} from "./colors";

export type {
  LanguageFootprint,
  LanguageFootprintEntry,
  RepositoryLanguageData,
  LanguageAggregationOptions,
} from "../types/language";
