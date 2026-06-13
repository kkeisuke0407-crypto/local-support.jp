export const serviceCategories = [
  {
    slug: 'legal-inspection',
    label: '法定点検・行政報告',
    description: '法律・条例で定期点検や報告が求められやすい施設管理サービスです。',
    serviceSlugs: [
      'jusuisou-seisou',
      'shobo-setsubi',
      'bouka-tenken',
      'tokushu-kenchiku',
      'elevator-hoshu',
      'jikayou-denki',
      'furon-tenken',
      'johkasou',
      'signboard-inspection',
    ],
  },
  {
    slug: 'hygiene-cleaning',
    label: '衛生・清掃・店舗設備',
    description: '飲食店・ビル・工場・福祉施設で衛生維持や設備保全に関わるサービスです。',
    serviceSlugs: [
      'duct',
      'grease-trap',
      'aircon-business',
      'pest-control',
      'haisuikan',
      'reito-reizou',
    ],
  },
  {
    slug: 'repair-construction',
    label: '修繕・改修・撤去工事',
    description: '建物の劣化対策・改修・撤去・原状回復と一緒に検討されやすいサービスです。',
    serviceSlugs: [
      'asbestos',
      'shutter',
      'gaiheki-toso',
      'yane-fukikae',
      'kaitai',
      'zanchibutsu',
      'office-iten',
    ],
  },
  {
    slug: 'energy-security',
    label: 'エネルギー・防犯・システム',
    description: '施設の省エネ・防災・防犯・入退室管理に関わる設備系サービスです。',
    serviceSlugs: [
      'solar-cleaning',
      'solar-om',
      'chikudenchi',
      'bohan-camera',
      'nyutaishitsu',
    ],
  },
] as const;

export function findServiceCategory(serviceSlug: string) {
  return serviceCategories.find((category) => category.serviceSlugs.includes(serviceSlug));
}
