
// Placeholder for Terms of Service page
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <p>Welcome to RX Prescribers!</p>
          <p>
            These terms and conditions outline the rules and regulations for the
            use of RX Prescribers's Website, located at your website URL.
          </p>
          <p>
            By accessing this website we assume you accept these terms and
            conditions. Do not continue to use RX Prescribers if you do not agree
            to take all of the terms and conditions stated on this page.
          </p>
          <h2 className="text-xl font-semibold text-foreground pt-4">Interpretation and Definitions</h2>
          <p>
            The words of which the initial letter is capitalized have meanings
            defined under the following conditions. The following definitions
            shall have the same meaning regardless of whether they appear in
            singular or in plural.
          </p>
          {/* Add more placeholder content as needed */}
          <h2 className="text-xl font-semibold text-foreground pt-4">Intellectual Property</h2>
          <p>
            Unless otherwise stated, RX Prescribers and/or its licensors own
            the intellectual property rights for all material on
            RX Prescribers. All intellectual property rights are reserved. You
            may access this from RX Prescribers for your own personal use
            subjected to restrictions set in these terms and conditions.
          </p>
          <p>You must not:</p>
          <ul className="list-disc list-inside ml-4">
            <li>Republish material from RX Prescribers</li>
            <li>Sell, rent or sub-license material from RX Prescribers</li>
            <li>Reproduce, duplicate or copy material from RX Prescribers</li>
            <li>Redistribute content from RX Prescribers</li>
          </ul>
          <h2 className="text-xl font-semibold text-foreground pt-4">Disclaimer</h2>
          <p>
            The information provided by RX Prescribers is for general informational purposes only. All information on the Site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability or completeness of any information on the Site.
          </p>
          <p>
            UNDER NO CIRCUMSTANCE SHALL WE HAVE ANY LIABILITY TO YOU FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF THE SITE OR RELIANCE ON ANY INFORMATION PROVIDED ON THE SITE. YOUR USE OF THE SITE AND YOUR RELIANCE ON ANY INFORMATION ON THE SITE IS SOLELY AT YOUR OWN RISK.
          </p>
          <p className="pt-6 text-center text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
