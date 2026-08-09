// GERADO por scripts/srd/proficiencias.mjs — não edite à mão.
//
// O que cada classe sabe lutar e vestir, do quadro "Core <Classe> Traits" do
// SRD. Antes isto era um campo de texto livre na ficha que ninguém lia — nem a
// pessoa nem o app.
//
// SRD 5.2.1, Creative Commons Attribution 4.0.

import type { ProficienciasDeClasse } from '../../lib/proficiencias'

export const PROFICIENCIAS_SRD: Record<string, ProficienciasDeClasse> = {
  "Bárbaro": {
    armas: { simples: true, marciais: true, propriedades: [] },
    armaduras: { leve: true, media: true, pesada: false, escudo: true },
    ferramentas: "Choose 3 Musical Instruments (see “Equipment”)",
  },
  "Bardo": {
    armas: { simples: true, marciais: false, propriedades: [] },
    armaduras: { leve: true, media: false, pesada: false, escudo: false },
    ferramentas: "Choose 3 Musical Instruments (see “Equipment”)",
  },
  "Clérigo": {
    armas: { simples: true, marciais: false, propriedades: [] },
    armaduras: { leve: true, media: true, pesada: false, escudo: true },
    ferramentas: "Herbalism Kit",
  },
  "Druida": {
    armas: { simples: true, marciais: false, propriedades: [] },
    armaduras: { leve: true, media: false, pesada: false, escudo: true },
    ferramentas: "Herbalism Kit",
  },
  "Guerreiro": {
    armas: { simples: true, marciais: true, propriedades: [] },
    armaduras: { leve: true, media: true, pesada: true, escudo: true },
    ferramentas: "Choose one type of Artisan’s Tools or Musical Instrument(see “Equipment”)",
  },
  "Monge": {
    armas: { simples: true, marciais: false, propriedades: ['Leve'] },
    armaduras: { leve: false, media: false, pesada: false, escudo: false },
    ferramentas: "Choose one type of Artisan’s Tools or Musical Instrument(see “Equipment”)",
  },
  "Paladino": {
    armas: { simples: true, marciais: true, propriedades: [] },
    armaduras: { leve: true, media: true, pesada: true, escudo: true },
    ferramentas: "Thieves’ Tools",
  },
  "Patrulheiro": {
    armas: { simples: true, marciais: true, propriedades: [] },
    armaduras: { leve: true, media: true, pesada: false, escudo: true },
    ferramentas: "Thieves’ Tools",
  },
  "Ladino": {
    armas: { simples: true, marciais: false, propriedades: ['Acuidade', 'Leve'] },
    armaduras: { leve: true, media: false, pesada: false, escudo: false },
    ferramentas: "Thieves’ Tools",
  },
  "Feiticeiro": {
    armas: { simples: true, marciais: false, propriedades: [] },
    armaduras: { leve: false, media: false, pesada: false, escudo: false },
  },
  "Bruxo": {
    armas: { simples: true, marciais: false, propriedades: [] },
    armaduras: { leve: true, media: false, pesada: false, escudo: false },
  },
  "Mago": {
    armas: { simples: true, marciais: false, propriedades: [] },
    armaduras: { leve: false, media: false, pesada: false, escudo: false },
  },
}
