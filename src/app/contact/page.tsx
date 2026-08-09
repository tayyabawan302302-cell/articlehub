import type { Metadata } from "next";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the ArticleHub team.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-display text-3xl font-semibold mb-8">Contact us</h1>
      <ContactForm />
    </div>
  );
}
