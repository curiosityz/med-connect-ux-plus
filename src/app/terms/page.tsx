
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TermsPage() {
  const lastUpdatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto py-10 md:py-16 px-4">
      <Card className="max-w-3xl mx-auto shadow-xl bg-card border">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl md:text-4xl font-bold text-primary">Terms of Service</CardTitle>
        </CardHeader>
        <ScrollArea className="h-[calc(100vh-20rem)] md:h-[calc(100vh-24rem)]">
          <CardContent className="space-y-6 text-muted-foreground px-6 md:px-8 pb-8">
            <p className="text-sm text-center">Last updated: {lastUpdatedDate}</p>
            
            <p>Welcome to RX Prescribers!</p>
            <p>
              These terms and conditions outline the rules and regulations for the
              use of RX Prescribers's Website, accessible from your website URL.
            </p>
            <p>
              By accessing this website we assume you accept these terms and
              conditions. Do not continue to use RX Prescribers if you do not agree
              to take all of the terms and conditions stated on this page.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-6">1. Interpretation and Definitions</h2>
            <p>
              The words of which the initial letter is capitalized have meanings
              defined under the following conditions. The following definitions
              shall have the same meaning regardless of whether they appear in
              singular or in plural.
            </p>
            {/* Add more specific definitions if needed */}

            <h2 className="text-2xl font-semibold text-foreground pt-6">2. Intellectual Property Rights</h2>
            <p>
              Other than the content you own, under these Terms, RX Prescribers and/or its licensors own
              all the intellectual property rights and materials contained in this Website.
              You are granted limited license only for purposes of viewing the material contained on this Website.
            </p>
            <p>You must not:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Republish material from RX Prescribers</li>
              <li>Sell, rent or sub-license material from RX Prescribers</li>
              <li>Reproduce, duplicate or copy material from RX Prescribers</li>
              <li>Redistribute content from RX Prescribers</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground pt-6">3. User Accounts</h2>
            <p>
              When you create an account with us, you must provide us information that is accurate, complete, 
              and current at all times. Failure to do so constitutes a breach of the Terms, which may result 
              in immediate termination of your account on our Service.
            </p>
            <p>
              You are responsible for safeguarding the password that you use to access the Service and for any 
              activities or actions under your password, whether your password is with our Service or a third-party service.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-6">4. Limitation of Liability</h2>
            <p>
              The information provided by RX Prescribers is for general informational purposes only. All information on the Site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability or completeness of any information on the Site. The information provided is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
            <p>
              UNDER NO CIRCUMSTANCE SHALL WE HAVE ANY LIABILITY TO YOU FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF THE SITE OR RELIANCE ON ANY INFORMATION PROVIDED ON THE SITE. YOUR USE OF THE SITE AND YOUR RELIANCE ON ANY INFORMATION ON THE SITE IS SOLELY AT YOUR OWN RISK.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-6">5. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of Your Jurisdiction, without regard to its conflict of law provisions.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-6">6. Changes to These Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
              If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. 
              What constitutes a material change will be determined at our sole discretion.
            </p>

            <h2 className="text-2xl font-semibold text-foreground pt-6">7. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at [Your Contact Email/Page].
            </p>
            
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
