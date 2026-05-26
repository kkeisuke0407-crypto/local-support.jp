import type { ServiceData } from './_types';
import jusuisouSeisou from './jusuisou-seisou';
import asbestos from './asbestos';
import duct from './duct';
import shutter from './shutter';
import shoboSetsubi from './shobo-setsubi';

export const allServices: ServiceData[] = [jusuisouSeisou, asbestos, duct, shutter, shoboSetsubi];

export const serviceBySlug = Object.fromEntries(
  allServices.map((s) => [s.slug, s])
) as Record<string, ServiceData>;
