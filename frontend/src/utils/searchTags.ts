export type SearchTagDefinition = {
  id: string;
  label: string;
  query: string;
};

export const SEARCH_TAG_DEFINITIONS: SearchTagDefinition[] = [
  { id: "lagos", label: "Lagos", query: "Lagos" },
  { id: "abuja", label: "Abuja", query: "Abuja" },
  { id: "ph", label: "Port Harcourt", query: "Port Harcourt" },
  { id: "nysc", label: "NYSC", query: "NYSC" },
  { id: "asuu", label: "ASUU", query: "ASUU" },
  { id: "visa", label: "Visa", query: "visa" },
  { id: "rent", label: "Rent", query: "rent" },
  { id: "transfer-news", label: "Transfer News", query: "football transfer news" },
  { id: "side-hustle", label: "Side Hustle", query: "side hustle" },
  { id: "food", label: "Food", query: "food spots" },
  { id: "power", label: "Power", query: "NEPA power light" },
  { id: "dating", label: "Dating", query: "dating relationships" },
];
