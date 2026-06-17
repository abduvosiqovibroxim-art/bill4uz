import type { Metadata } from "next";
import { BookingPageClient } from "./BookingPageClient";

export const metadata: Metadata = {
  title: "Забронировать бильярд",
  description: "Карта бильярдных мест Billuz"
};

export default function BookingPage() {
  return <BookingPageClient />;
}
