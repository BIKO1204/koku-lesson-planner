export const runtime = "nodejs";
export const revalidate = 0;

import ContactClient from "./Client";

export default function ContactPage() {
  return <ContactClient />;
}

