/**
 * Normalizes treatment names to group similar treatments together.
 */
export function normalizeTreatmentName(name: string): string {
  if (!name) return 'Unknown';
  
  const lowerName = name.toLowerCase().trim();
  
  // Root Canal Treatment
  if (
    lowerName.includes('rct') || 
    lowerName.includes('root canal') || 
    lowerName.includes('endodontic')
  ) {
    return 'Root Canal Treatment (RCT)';
  }
  
  // Implants
  if (
    lowerName.includes('implant') || 
    lowerName.includes('dental implant')
  ) {
    return 'Dental Implant';
  }
  
  // Orthodontics
  if (
    lowerName.includes('ortho') || 
    lowerName.includes('brace') || 
    lowerName.includes('aligner')
  ) {
    return 'Orthodontics';
  }
  
  // Extraction
  if (
    lowerName.includes('extract') || 
    lowerName.includes('removal') || 
    lowerName.includes('tooth pull')
  ) {
    return 'Extraction';
  }
  
  // Scaling / Cleaning
  if (
    lowerName.includes('scaling') || 
    lowerName.includes('clean') || 
    lowerName.includes('prophylaxis')
  ) {
    return 'Scaling & Cleaning';
  }
  
  // Crowns / Bridges
  if (
    lowerName.includes('crown') || 
    lowerName.includes('bridge') || 
    lowerName.includes('cap') ||
    lowerName.includes('prosthetic')
  ) {
    return 'Crowns & Bridges';
  }
  
  // Fillings
  if (
    lowerName.includes('fill') || 
    lowerName.includes('composite') || 
    lowerName.includes('restoration')
  ) {
    return 'Dental Filling';
  }
  
  // Whitening
  if (
    lowerName.includes('whiten') || 
    lowerName.includes('bleach')
  ) {
    return 'Teeth Whitening';
  }
  
  // Dentures
  if (
    lowerName.includes('denture') || 
    lowerName.includes('partial')
  ) {
    return 'Dentures';
  }

  // Capitalize first letter of each word for others
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
