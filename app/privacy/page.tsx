import Link from "next/link";
export const metadata = {
  title: "Privacy",
  description: "How Varun Sharma handles portfolio enquiries.",
};
export default function Privacy() {
  return (
    <main className="privacy-page container">
      <Link className="brand" href="/">
        VARUN SHARMA
      </Link>
      <article>
        <span className="eyebrow">Privacy</span>
        <h1>Your information, handled carefully.</h1>
        <p>
          If you submit an enquiry through Z, the name, email address, subject, and message you
          provide are stored in a private Supabase database so Varun can review and respond. The
          website does not send email automatically.
        </p>
        <p>
          Enquiries are available only to the authorized portfolio administrator. Do not include
          sensitive personal or financial information in a message.
        </p>
        <p>
          Chat questions are sent to Groq to generate a reply based on public portfolio content. Do
          not share confidential information with the assistant.
        </p>
        <p>
          To ask about an enquiry or request its removal, contact Varun using a public contact
          method listed on the portfolio, if available.
        </p>
        <p>
          <Link href="/">Return to portfolio</Link>
        </p>
      </article>
    </main>
  );
}
