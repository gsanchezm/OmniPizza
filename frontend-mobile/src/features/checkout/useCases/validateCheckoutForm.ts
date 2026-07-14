import type { CountryCode } from "../../../store/useAppStore";
import type { CheckoutFormState } from "./buildCheckoutPayload";

export function validateCheckoutForm(input: {
  country: CountryCode;
  form: CheckoutFormState;
  paymentMethod: "card" | "cash" | "paypal";
  t: (key: string) => string;
}): string {
  const { country, form, paymentMethod, t } = input;

  if (!form.address.trim()) return t("validationAddressRequired");
  if (country === "MX" && !form.colonia.trim()) return t("validationColoniaRequired");
  if (country === "MX" && (!form.zip_code.trim() || form.zip_code.trim().length !== 5)) return t("validationZipFiveDigits");
  if (country === "US" && (!form.zip_code.trim() || form.zip_code.trim().length !== 5)) return t("validationZipFiveDigits");
  if (country === "CH" && !form.plz.trim()) return t("validationPlzRequired");
  if (country === "JP" && !form.prefectura.trim()) return t("validationPrefectureRequired");
  if (country === "SA" && !form.district.trim()) return t("validationDistrictRequired");
  if (!form.name.trim()) return t("validationFullNameRequired");
  if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 8) {
    return t("validationPhoneMinDigits");
  }

  if (paymentMethod === "card") {
    if (!form.card_holder.trim()) return t("validationCardHolderRequired");
    if (form.card_number.replace(/\D/g, "").length < 13) {
      return t("validationCardNumberMinDigits");
    }
    if (form.card_expiry.replace(/\D/g, "").length < 4) {
      return t("validationCardExpiryRequired");
    }
    if (form.card_cvv.replace(/\D/g, "").length < 3) {
      return t("validationCvvMinDigits");
    }
  }

  return "";
}
