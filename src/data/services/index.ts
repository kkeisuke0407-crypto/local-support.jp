import type { ServiceData } from './_types';
import jusuisouSeisou from './jusuisou-seisou';
import asbestos from './asbestos';
import duct from './duct';
import shutter from './shutter';
import shoboSetsubi from './shobo-setsubi';
import greaseTrap from './grease-trap';
import airconBusiness from './aircon-business';
import pestControl from './pest-control';
import signboardInspection from './signboard-inspection';

export const allServices: ServiceData[] = [
  jusuisouSeisou,
  asbestos,
  duct,
  shutter,
  shoboSetsubi,
  greaseTrap,
  airconBusiness,
  pestControl,
  signboardInspection,
];

export const serviceBySlug = Object.fromEntries(
  allServices.map((s) => [s.slug, s])
) as Record<string, ServiceData>;
