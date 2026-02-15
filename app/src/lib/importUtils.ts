import type { ViewMode } from "@/types";


export function validateProgramDefinition(data: any): string | true {
  if(!data || typeof data !== 'object') {
    return "Importovaná data nemají správnou strukturu";
  }

  if(typeof data.name !== 'string' || data.name.trim() === '') {
    return "Chybný název programu";
  }

  if(data.description !== undefined && typeof data.description !== 'string') {
    return "Popis programu musí být řetězec";
  }

  if(typeof data.definition !== 'string') {
    return "Definice CCS musí být řetězec";
  }

  if(typeof data.allowEdit !== 'boolean') {
    return "Povolení úprav musí být boolean";
  }

  if(!Array.isArray(data.cards)) {
    return "Program musí obsahovat pole karet (SOS nebo LTS)";
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
    return "Karta není platný objekt";
  }

  if(typeof card.name !== 'string' || card.name.trim() === '') {
    return "Chybí název karty";
  }

  if(!('type' in card)) {
    return "Chybí typ karty";
  }

  if(card.type === 'sos') {
    const res = validateCardSOS(card);
    return res;
  }
  else if(card.type === 'lts') {
    const res = validateCardLTS(card);
    return res;
  }

  return "Neznámý typ karty '"+card.type+"'";
}

function validateCardSOS(card: any): string | true {
  if(typeof card.processX !== 'string' || typeof card.processY !== 'string' || 
    typeof card.action !== 'string' || /*typeof card.useStructRed !== 'boolean' || */
    typeof card.showHelp !== 'boolean') {
    return "Karta má chybnou strukturu";
  }
  return true;
}

function validateCardLTS(card: any): string | true {
  if (typeof card.process !== 'string' || typeof card.useStructRed !== 'boolean') {
    return "Karta má chybnou strukturu";
  }
  
  const validStyles: ViewMode[] = ['id', 'mixed', 'full'];
  if(!validStyles.includes(card.style)) {
    return "Karta obsahuje neplatný styl zobrazení.";
  }

  return true;
}