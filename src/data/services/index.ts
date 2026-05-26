import type { ServiceData } from './_types';
import jusuisouSeisou from './jusuisou-seisou';
import asbestos from './asbestos';
import duct from './duct';
import shutter from './shutter';

export const allServices: ServiceData[] = [jusuisouSeisou, asbestos, duct, shutter];

export const serviceBySlug = Object.fromEntries(
  allServices.map((s) => [s.slug, s])
) as Record<string, ServiceData>;
