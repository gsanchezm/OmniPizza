import type { CountryCode } from "../../../store/useAppStore";
import type { CheckoutFormState } from "./buildCheckoutPayload";

export function validateCheckoutForm(input: {
  country: CountryCode;
  form: CheckoutFormState;
  paymentMethod: "card" | "cash";
  t: (key: string) => string;
}): string {
  const { country, form, paymentMethod, t } = input;

  if (!form.address.trim()) return `${t("streetAndNumber")} is required.`;
  if (country === "MX" && !form.colonia.trim()) return `${t("colonia")} is required.`;
  if (country === "US" && !form.zip_code.trim()) return `${t("zipCode")} is required.`;
  if (country === "CH" && !form.plz.trim()) return `${t("plz")} is required.`;
  if (country === "JP" && !form.prefectura.trim()) return `${t("prefecture")} is required.`;
  if (!form.name.trim()) return `${t("fullName")} is required.`;
  if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 7) {
    return `${t("phone")} must be at least 7 digits.`;
  }

  if (paymentMethod === "card") {
    if (!form.card_holder.trim()) return `${t("cardHolder")} is required.`;
    if (form.card_number.replace(/\D/g, "").length < 13) {
      return `${t("cardNumber")} must be at least 13 digits.`;
    }
    if (form.card_expiry.replace(/\D/g, "").length < 4) {
      return `${t("cardExpiry")} is required (MMYY).`;
    }
    if (form.card_cvv.replace(/\D/g, "").length < 3) {
      return `${t("cvv")} must be at least 3 digits.`;
    }
  }

  return "";
}
