import type { Metadata } from "next";
import { BookingPageClient } from "./BookingPageClient";

export const metadata: Metadata = {
  title: "Забронировать бильярд",
  description: "Карта бильярдных мест Bill4"
};

export default function BookingPage() {
  return <BookingPageClient />;
}
