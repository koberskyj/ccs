import type { ViewMode } from "@/types";
import { t } from "i18next";


export function validateProgramDefinition(data: any): string | true {
  if(!data || typeof data !== 'object') {
    return t('selector.invalidProgramFormatError');
  }

  if(typeof data.name !== 'string' || data.name.trim() === '') {
    return t('selector.invalidProgramNameError');
  }

  if(data.description !== undefined && typeof data.description !== 'string') {
    return t('selector.invalidProgramDescriptionError');
  }

  if(typeof data.definition !== 'string') {
    return t('selector.invalidProgramDefinitionError');
  }

  if(typeof data.allowEdit !== 'boolean') {
    return t('selector.invalidProgramAllowEditError');
  }

  if(!Array.isArray(data.cards)) {
    return t('selector.invalidProgramCardsError');
  }

  for(let i = 0; i < data.cards.length; i++) {
    const card = data.cards[i];
    const cardErrorPrefix = `Chyba v kartě č. ${i + 1}: `;
    const res = validateCard(card);
    if(res !== true) {
      return cardErrorPrefix + res;
    }
  }

  return true;
}

export function validateCard(card: any): string | true {
  if(typeof card !== 'object' || card === null) {
    return t('selector.invalidCardObjectError');
  }

  if(typeof card.name !== 'string' || card.name.trim() === '') {
    return t('selector.invalidCardNameError');
  }

  if(!('type' in card)) {
    return t('selector.missingCardTypeError');
  }

  if(card.type === 'sos') {
    const res = validateCardSOS(card);
    return res;
  }
  else if(card.type === 'lts') {
    const res = validateCardLTS(card);
    return res;
  }

  return t('selector.unknownCardTypeError', { type: card.type });
}

function validateCardSOS(card: any): string | true {
  if(typeof card.processX !== 'string' || typeof card.processY !== 'string' || 
    typeof card.action !== 'string' || /*typeof card.useStructRed !== 'boolean' || */
    typeof card.showHelp !== 'boolean') {
    return t('selector.invalidCardStructureError');
  }
  return true;
}

function validateCardLTS(card: any): string | true {
  if (typeof card.process !== 'string' || typeof card.useStructRed !== 'boolean') {
    return t('selector.invalidCardStructureError');
  }
  
  const validStyles: ViewMode[] = ['id', 'mixed', 'full'];
  if(!validStyles.includes(card.style)) {
    return t('selector.invalidCardStyleError');
  }

  return true;
}