type ResidentAddress = {
 house_number?: string | null;
 street?: string | null;
 close?: string | null;
};

function withLocationSuffix(value: string, suffix: "Street" | "Close") {
 const trimmedValue = value.trim();
 if (trimmedValue.toLowerCase().endsWith(suffix.toLowerCase())) return trimmedValue;
 return `${trimmedValue} ${suffix}`;
}

export function formatResidentLocation(address: ResidentAddress) {
 if (address.close?.trim()) return withLocationSuffix(address.close, "Close");
 if (address.street?.trim()) return withLocationSuffix(address.street, "Street");
 return "Location unavailable";
}

export function formatResidentAddress(address: ResidentAddress) {
 return [address.house_number?.trim(), formatResidentLocation(address)]
 .filter(Boolean)
 .join(", ");
}
