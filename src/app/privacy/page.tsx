
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PrivacyPage() {
  const lastUpdatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto py-10 md:py-16 px-4">
      <Card className="max-w-3xl mx-auto shadow-xl bg-card border">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl md:text-4xl font-bold text-primary">Privacy Policy</CardTitle>
        </CardHeader>
        <ScrollArea className="h-[calc(100vh-20rem)] md:h-[calc(100vh-24rem)]">
          <CardContent className="space-y-6 text-muted-foreground px-6 md:px-8 pb-8">
            <p className="text-sm text-center">Last updated: {lastUpdatedDate}</p>
            <p>
              Your privacy is important to us. It is RX Prescribers's policy to
              respect your privacy regarding any information we may collect from
              you across our website.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-6">1. Information We Collect</h2>
            <p>
              We only ask for personal information when we truly need it to
              provide a service to you. We collect it by fair and lawful means,
              with your knowledge and consent. We also let you know why we’re
              collecting it and how it will be used.
            </p>
            <p>
              Information we collect may include:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                Personal identification information (Name, email address, etc.) provided during account registration via Clerk.
              </li>
              <li>
                Search queries (medication name, zipcode, radius) to provide search results and improve our services. This data is used in an aggregated and anonymized form for analytics where possible.
              </li>
              <li>
                Log data, which is standard for most websites, may include your IP address, browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, and other statistics. This data is used for security, debugging, and service improvement.
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground pt-6">2. How We Use Your Information</h2>
            <p>
              We use the information we collect in various ways, including to:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Provide, operate, and maintain our website and its services.</li>
              <li>Authenticate users and manage user accounts via Clerk.</li>
              <li>Improve, personalize, and expand our website.</li>
              <li>Understand and analyze how you use our website to enhance user experience.</li>
              <li>Develop new products, services, features, and functionality.</li>
              <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes (with your consent where required).</li>
              <li>Send you emails related to your account or service updates.</li>
              <li>Find and prevent fraud and ensure the security of our platform.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground pt-6">3. Data Storage and Security</h2>
            <p>
              We only retain collected information for as long as necessary to provide you with your requested service. 
              What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, 
              as well as unauthorized access, disclosure, copying, use or modification. Our authentication provider, Clerk, is responsible for the security of your authentication credentials.
            </p>
            <p>
              The security of your Personal Information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-6">4. Cookies</h2>
             <p>
              Our website uses cookies to enhance user experience. Cookies are small files stored on your device. We use cookies for session management (via Clerk) and to remember your preferences. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-6">5. Third-Party Services</h2>
            <p>
              We use Clerk for user authentication. Clerk has its own privacy policy regarding the data it collects and processes for authentication purposes. We may also use other third-party services for analytics or other functionalities, and their use of your information will be governed by their respective privacy policies.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground pt-6">6. Children's Privacy</h2>
            <p>
              Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with Personal Information, please contact us. If we become aware that we have collected Personal Information from children without verification of parental consent, we take steps to remove that information from our servers.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-6">7. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              You are advised to review this Privacy Policy periodically for any
              changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
            
            <h2 className="text-2xl font-semibold text-foreground pt-6">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at [Your Contact Email/Page].
            </p>
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
