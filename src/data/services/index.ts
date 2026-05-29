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
import jikayouDenki from './jikayou-denki';
import elevatorHoshu from './elevator-hoshu';
import johkasou from './johkasou';
import haisuikan from './haisuikan';
import tokushuKenchiku from './tokushu-kenchiku';
import boukaTenken from './bouka-tenken';
import furonTenken from './furon-tenken';
import reitoReizou from './reito-reizou';

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
  jikayouDenki,
  elevatorHoshu,
  johkasou,
  haisuikan,
  tokushuKenchiku,
  boukaTenken,
  furonTenken,
  reitoReizou,
];

export const serviceBySlug = Object.fromEntries(
  allServices.map((s) => [s.slug, s])
) as Record<string, ServiceData>;
